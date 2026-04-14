<?php
ini_set('display_errors', 0);
error_reporting(0);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include 'conexion.php';

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data || !isset($data['type'])) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid payload']);
    exit();
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseBrowser($ua) {
    if (strpos($ua, 'Edg/')   !== false) return 'Edge';
    if (strpos($ua, 'OPR/')   !== false) return 'Opera';
    if (strpos($ua, 'Opera')  !== false) return 'Opera';
    if (strpos($ua, 'Chrome') !== false) return 'Chrome';
    if (strpos($ua, 'Firefox')!== false) return 'Firefox';
    if (strpos($ua, 'Safari') !== false) return 'Safari';
    if (strpos($ua, 'MSIE')   !== false) return 'IE';
    if (strpos($ua, 'Trident')!== false) return 'IE';
    return 'Otro';
}

function parseOS($ua) {
    if (strpos($ua, 'Windows') !== false) return 'Windows';
    if (strpos($ua, 'Mac OS X')!== false) return 'macOS';
    if (strpos($ua, 'Android') !== false) return 'Android';
    if (strpos($ua, 'iPhone')  !== false) return 'iOS';
    if (strpos($ua, 'iPad')    !== false) return 'iOS';
    if (strpos($ua, 'Linux')   !== false) return 'Linux';
    return 'Otro';
}

function esc($conn, $val, $max = 500) {
    return mysqli_real_escape_string($conn, substr((string)$val, 0, $max));
}

function geoFromIP($ip) {
    if (in_array($ip, ['127.0.0.1', '::1', ''])) return ['', '', ''];
    $resp = @file_get_contents("http://ip-api.com/json/{$ip}?fields=status,country,regionName,city&lang=es");
    if (!$resp) return ['', '', ''];
    $geo = json_decode($resp, true);
    if (!$geo || ($geo['status'] ?? '') === 'fail') return ['', '', ''];
    return [$geo['country'] ?? '', $geo['regionName'] ?? '', $geo['city'] ?? ''];
}

// ── Dispatch ──────────────────────────────────────────────────────────────────

$type = $data['type'];

if ($type === 'pageview') {

    $sid     = esc($conexion, $data['session_id'] ?? '', 36);
    $uid     = esc($conexion, $data['user_id']    ?? '', 36);
    if (!$sid || !$uid) { echo json_encode(['ok' => false]); exit(); }

    $device  = in_array($data['device'] ?? '', ['desktop','mobile','tablet'])
               ? $data['device'] : 'desktop';
    $ua      = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $browser = esc($conexion, parseBrowser($ua), 80);
    $os      = esc($conexion, parseOS($ua),      80);
    $sw      = (int)($data['screen_w'] ?? 0);
    $sh      = (int)($data['screen_h'] ?? 0);
    $ip      = $_SERVER['REMOTE_ADDR'] ?? '';

    [$country, $region, $city] = geoFromIP($ip);
    $country = esc($conexion, $country, 80);
    $region  = esc($conexion, $region,  80);
    $city    = esc($conexion, $city,    80);
    $ip      = esc($conexion, $ip,      45);

    $referrer   = esc($conexion, $data['referrer']    ?? '');
    $landing    = esc($conexion, $data['landing_page']?? '');
    $utm_source = esc($conexion, $data['utm_source']  ?? '', 100);
    $utm_medium = esc($conexion, $data['utm_medium']  ?? '', 100);
    $utm_camp   = esc($conexion, $data['utm_campaign']?? '', 100);
    $utm_cont   = esc($conexion, $data['utm_content'] ?? '', 100);
    $utm_term   = esc($conexion, $data['utm_term']    ?? '', 100);

    mysqli_query($conexion, "
        INSERT INTO av_sessions
            (id, user_id, ip, device_type, browser, os, screen_w, screen_h,
             country, region, city, referrer, landing_page,
             utm_source, utm_medium, utm_campaign, utm_content, utm_term, page_count)
        VALUES
            ('{$sid}','{$uid}','{$ip}','{$device}','{$browser}','{$os}',
             {$sw},{$sh},'{$country}','{$region}','{$city}',
             '{$referrer}','{$landing}',
             '{$utm_source}','{$utm_medium}','{$utm_camp}','{$utm_cont}','{$utm_term}', 1)
        ON DUPLICATE KEY UPDATE page_count = page_count + 1
    ");

    $page   = esc($conexion, $data['page']       ?? '/');
    $title  = esc($conexion, $data['page_title'] ?? '', 200);
    $pvref  = esc($conexion, $data['referrer']   ?? '');

    mysqli_query($conexion, "
        INSERT INTO av_pageviews (session_id, user_id, page, page_title, referrer)
        VALUES ('{$sid}','{$uid}','{$page}','{$title}','{$pvref}')
    ");

    echo json_encode(['ok' => true]);

} elseif ($type === 'update') {

    $sid    = esc($conexion, $data['session_id'] ?? '', 36);
    $page   = esc($conexion, $data['page']       ?? '/');
    $time   = max(0, min(3600, (int)($data['time_on_page'] ?? 0)));
    $scroll = max(0, min(100,  (int)($data['scroll_depth'] ?? 0)));

    mysqli_query($conexion, "
        UPDATE av_pageviews
           SET time_on_page = {$time}, scroll_depth = {$scroll}
         WHERE session_id = '{$sid}' AND page = '{$page}'
         ORDER BY id DESC LIMIT 1
    ");

    echo json_encode(['ok' => true]);

} elseif ($type === 'event') {

    $sid    = esc($conexion, $data['session_id']  ?? '', 36);
    $uid    = esc($conexion, $data['user_id']     ?? '', 36);
    $page   = esc($conexion, $data['page']        ?? '/');
    $etype  = esc($conexion, $data['event_type']  ?? '', 50);
    $elabel = esc($conexion, $data['event_label'] ?? '', 200);
    $evalue = esc($conexion, $data['event_value'] ?? '', 200);

    if ($sid && $etype) {
        mysqli_query($conexion, "
            INSERT INTO av_events (session_id, user_id, page, event_type, event_label, event_value)
            VALUES ('{$sid}','{$uid}','{$page}','{$etype}','{$elabel}','{$evalue}')
        ");
    }

    echo json_encode(['ok' => true]);

} else {
    http_response_code(400);
    echo json_encode(['error' => 'unknown type']);
}

mysqli_close($conexion);
?>

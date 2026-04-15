<?php
ini_set('display_errors', 0);
error_reporting(0);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include 'conexion.php';

// ── Params ────────────────────────────────────────────────────────────────────
$range_str   = $_GET['range'] ?? '30';
$range       = in_array($range_str, ['7','30','90']) ? (int)$range_str : 30;
$gran_str    = $_GET['gran']  ?? 'day';
$granularity = in_array($gran_str, ['day','week','month']) ? $gran_str : 'day';

$dateGroup = [
    'day'   => "DATE_FORMAT(created_at, '%d %b')",
    'week'  => "CONCAT('S', WEEK(created_at,1))",
    'month' => "DATE_FORMAT(created_at, '%b %Y')",
][$granularity];

$dateGroupSession = str_replace('created_at', 's.created_at', $dateGroup);
$dateGroupPV      = str_replace('created_at', 'pv.created_at', $dateGroup);
$dateGroupEv      = str_replace('created_at', 'e.created_at', $dateGroup);

// ── Page label map ────────────────────────────────────────────────────────────
// Used inside CASE statements
$pageCase = "
  CASE
    WHEN page LIKE '%/index.html%' OR page = '/' OR page LIKE '%/Avantservice/%' THEN 'Inicio'
    WHEN page LIKE '%/blog.html%'             THEN 'Blog'
    WHEN page LIKE '%/calderas.html%'         THEN 'Calderas'
    WHEN page LIKE '%/electrodomesticos.html%' THEN 'Electrodomésticos'
    WHEN page LIKE '%/tv.html%'               THEN 'Televisores'
    WHEN page LIKE '%/articulo.html%'         THEN 'Artículo'
    WHEN page LIKE '%/success.html%'          THEN 'Formulario OK'
    ELSE page
  END
";

// ── Helpers ───────────────────────────────────────────────────────────────────

function q($conn, $sql) {
    return mysqli_query($conn, $sql);
}

function rows($conn, $sql) {
    $res = mysqli_query($conn, $sql);
    $out = [];
    if ($res) while ($r = mysqli_fetch_assoc($res)) $out[] = $r;
    return $out;
}

function scalar($conn, $sql, $key = 'v') {
    $res = mysqli_query($conn, $sql);
    if (!$res) return 0;
    $r = mysqli_fetch_assoc($res);
    return $r ? (float)$r[$key] : 0;
}

function anomalies($series) {
    $vals = array_column($series, 'value');
    $n    = count($vals);
    if ($n < 3) return $series;
    $mean = array_sum($vals) / $n;
    $var  = array_sum(array_map(fn($v) => ($v - $mean) ** 2, $vals)) / $n;
    $std  = sqrt($var);
    foreach ($series as &$pt) {
        $pt['anomaly'] = ($std > 0 && abs($pt['value'] - $mean) / $std > 2.0);
    }
    return $series;
}

// ── Traffic source classification ─────────────────────────────────────────────
$sourceCase = "
  CASE
    WHEN utm_source != ''                                        THEN
      CASE utm_medium
        WHEN 'cpc' THEN 'Pago'
        WHEN 'paid' THEN 'Pago'
        ELSE CONCAT('UTM:', utm_source)
      END
    WHEN referrer = '' OR referrer IS NULL                       THEN 'Directo'
    WHEN referrer LIKE '%google.%' OR referrer LIKE '%bing.%'
      OR referrer LIKE '%yahoo.%'  OR referrer LIKE '%duckduckgo.%' THEN 'Orgánico'
    WHEN referrer LIKE '%facebook.%' OR referrer LIKE '%instagram.%'
      OR referrer LIKE '%twitter.%'  OR referrer LIKE '%x.com%'
      OR referrer LIKE '%linkedin.%' OR referrer LIKE '%tiktok.%'
      OR referrer LIKE '%youtube.%'  THEN 'Social'
    ELSE 'Referido'
  END
";

$out = [];

// ── 1. KPIs — periodo actual ──────────────────────────────────────────────────

$out['kpis'] = [];

// Visitas (pageviews)
$pv_total = (int)scalar($conexion, "SELECT COUNT(*) as v FROM av_pageviews pv WHERE pv.created_at >= DATE_SUB(NOW(), INTERVAL {$range} DAY)");
$pv_prev  = (int)scalar($conexion, "SELECT COUNT(*) as v FROM av_pageviews pv WHERE pv.created_at BETWEEN DATE_SUB(NOW(), INTERVAL ".($range*2)." DAY) AND DATE_SUB(NOW(), INTERVAL {$range} DAY)");

// Usuarios únicos
$uniq_curr = (int)scalar($conexion, "SELECT COUNT(DISTINCT s.user_id) as v FROM av_sessions s WHERE s.created_at >= DATE_SUB(NOW(), INTERVAL {$range} DAY)");
$uniq_prev = (int)scalar($conexion, "SELECT COUNT(DISTINCT s.user_id) as v FROM av_sessions s WHERE s.created_at BETWEEN DATE_SUB(NOW(), INTERVAL ".($range*2)." DAY) AND DATE_SUB(NOW(), INTERVAL {$range} DAY)");

// Sesiones
$ses_curr = (int)scalar($conexion, "SELECT COUNT(*) as v FROM av_sessions s WHERE s.created_at >= DATE_SUB(NOW(), INTERVAL {$range} DAY)");
$ses_prev = (int)scalar($conexion, "SELECT COUNT(*) as v FROM av_sessions s WHERE s.created_at BETWEEN DATE_SUB(NOW(), INTERVAL ".($range*2)." DAY) AND DATE_SUB(NOW(), INTERVAL {$range} DAY)");

// Tasa de rebote (sesiones con 1 sola página)
$bounce_curr = ($ses_curr > 0) ? round(scalar($conexion, "SELECT COUNT(*) as v FROM av_sessions s WHERE s.page_count = 1 AND s.created_at >= DATE_SUB(NOW(), INTERVAL {$range} DAY)") / $ses_curr * 100, 1) : 0;
$bounce_prev_cnt = (int)scalar($conexion, "SELECT COUNT(*) as v FROM av_sessions s WHERE s.page_count = 1 AND s.created_at BETWEEN DATE_SUB(NOW(), INTERVAL ".($range*2)." DAY) AND DATE_SUB(NOW(), INTERVAL {$range} DAY)");
$bounce_prev = ($ses_prev > 0) ? round($bounce_prev_cnt / $ses_prev * 100, 1) : 0;

// Tiempo medio en página (segundos)
$time_curr = round(scalar($conexion, "SELECT AVG(pv.time_on_page) as v FROM av_pageviews pv WHERE pv.time_on_page > 0 AND pv.created_at >= DATE_SUB(NOW(), INTERVAL {$range} DAY)"));
$time_prev = round(scalar($conexion, "SELECT AVG(pv.time_on_page) as v FROM av_pageviews pv WHERE pv.time_on_page > 0 AND pv.created_at BETWEEN DATE_SUB(NOW(), INTERVAL ".($range*2)." DAY) AND DATE_SUB(NOW(), INTERVAL {$range} DAY)"));

// Páginas por sesión
$pps_curr = ($ses_curr > 0) ? round($pv_total / $ses_curr, 2) : 0;
$pps_prev = ($ses_prev > 0) ? round($pv_prev  / $ses_prev, 2) : 0;

// Scroll medio
$scroll_curr = round(scalar($conexion, "SELECT AVG(pv.scroll_depth) as v FROM av_pageviews pv WHERE pv.scroll_depth > 0 AND pv.created_at >= DATE_SUB(NOW(), INTERVAL {$range} DAY)"));

function trend($curr, $prev) {
    if ($prev == 0) return null;
    return round(($curr - $prev) / $prev * 100, 1);
}

$out['kpis'] = [
    'visitas'       => ['curr' => $pv_total,    'prev' => $pv_prev,   'trend' => trend($pv_total, $pv_prev)],
    'usuarios'      => ['curr' => $uniq_curr,   'prev' => $uniq_prev, 'trend' => trend($uniq_curr, $uniq_prev)],
    'sesiones'      => ['curr' => $ses_curr,    'prev' => $ses_prev,  'trend' => trend($ses_curr, $ses_prev)],
    'rebote'        => ['curr' => $bounce_curr, 'prev' => $bounce_prev, 'trend' => trend($bounce_curr, $bounce_prev)],
    'tiempo_medio'  => ['curr' => (int)$time_curr, 'prev' => (int)$time_prev, 'trend' => trend($time_curr, $time_prev)],
    'paginas_sesion'=> ['curr' => $pps_curr,    'prev' => $pps_prev,  'trend' => trend($pps_curr, $pps_prev)],
    'scroll_medio'  => (int)$scroll_curr,
];

// ── 2. Serie temporal ─────────────────────────────────────────────────────────

$sql = "
    SELECT {$dateGroupPV} as label,
           COUNT(*) as visitas,
           COUNT(DISTINCT pv.user_id) as usuarios
    FROM av_pageviews pv
    WHERE pv.created_at >= DATE_SUB(NOW(), INTERVAL {$range} DAY)
    GROUP BY label
    ORDER BY MIN(pv.created_at) ASC
";
$temporal_raw = rows($conexion, $sql);

// Anomaly detection on visitas
$temporal = array_map(fn($r) => ['label' => $r['label'], 'visitas' => (int)$r['visitas'], 'usuarios' => (int)$r['usuarios'], 'value' => (int)$r['visitas']], $temporal_raw);
$temporal = anomalies($temporal);
// Remove internal 'value' key
$temporal = array_map(fn($r) => ['label' => $r['label'], 'visitas' => $r['visitas'], 'usuarios' => $r['usuarios'], 'anomalia' => $r['anomaly']], $temporal);

$out['temporal'] = $temporal;

// Serie del periodo anterior (para comparativa)
$sql_prev = "
    SELECT {$dateGroupPV} as label,
           COUNT(*) as visitas,
           COUNT(DISTINCT pv.user_id) as usuarios
    FROM av_pageviews pv
    WHERE pv.created_at BETWEEN DATE_SUB(NOW(), INTERVAL ".($range*2)." DAY) AND DATE_SUB(NOW(), INTERVAL {$range} DAY)
    GROUP BY label
    ORDER BY MIN(pv.created_at) ASC
";
$out['temporal_prev'] = array_map(fn($r) => ['label' => $r['label'], 'visitas' => (int)$r['visitas'], 'usuarios' => (int)$r['usuarios']], rows($conexion, $sql_prev));

// ── 3. Fuentes de tráfico ─────────────────────────────────────────────────────

$sql = "
    SELECT {$sourceCase} as fuente, COUNT(*) as total
    FROM av_sessions s
    WHERE s.created_at >= DATE_SUB(NOW(), INTERVAL {$range} DAY)
    GROUP BY fuente
    ORDER BY total DESC
";
$out['fuentes'] = array_map(fn($r) => ['name' => $r['fuente'], 'value' => (int)$r['total']], rows($conexion, $sql));

// Fuentes en el tiempo
$sql = "
    SELECT {$dateGroupSession} as label, {$sourceCase} as fuente, COUNT(*) as total
    FROM av_sessions s
    WHERE s.created_at >= DATE_SUB(NOW(), INTERVAL {$range} DAY)
    GROUP BY label, fuente
    ORDER BY MIN(s.created_at) ASC
";
$fuentes_tiempo_raw = rows($conexion, $sql);
$fuentes_tiempo = [];
foreach ($fuentes_tiempo_raw as $r) {
    $label = $r['label'];
    if (!isset($fuentes_tiempo[$label])) $fuentes_tiempo[$label] = ['label' => $label];
    $fuentes_tiempo[$label][$r['fuente']] = (int)$r['total'];
}
$out['fuentes_tiempo'] = array_values($fuentes_tiempo);

// ── 4. Dispositivos ───────────────────────────────────────────────────────────

$out['dispositivos'] = array_map(fn($r) => ['name' => ucfirst($r['device_type']), 'value' => (int)$r['total']],
    rows($conexion, "SELECT device_type, COUNT(*) as total FROM av_sessions s WHERE s.created_at >= DATE_SUB(NOW(), INTERVAL {$range} DAY) GROUP BY device_type ORDER BY total DESC")
);

$out['navegadores'] = array_map(fn($r) => ['name' => $r['browser'], 'value' => (int)$r['total']],
    rows($conexion, "SELECT browser, COUNT(*) as total FROM av_sessions s WHERE s.created_at >= DATE_SUB(NOW(), INTERVAL {$range} DAY) GROUP BY browser ORDER BY total DESC LIMIT 6")
);

$out['sistemas'] = array_map(fn($r) => ['name' => $r['os'], 'value' => (int)$r['total']],
    rows($conexion, "SELECT os, COUNT(*) as total FROM av_sessions s WHERE s.created_at >= DATE_SUB(NOW(), INTERVAL {$range} DAY) GROUP BY os ORDER BY total DESC LIMIT 6")
);

// ── 5. Localización ───────────────────────────────────────────────────────────

$out['paises'] = array_map(fn($r) => ['name' => $r['country'] ?: 'Desconocido', 'value' => (int)$r['total']],
    rows($conexion, "SELECT country, COUNT(*) as total FROM av_sessions s WHERE s.created_at >= DATE_SUB(NOW(), INTERVAL {$range} DAY) AND country != '' GROUP BY country ORDER BY total DESC LIMIT 10")
);

// ── 6. Top páginas ────────────────────────────────────────────────────────────

$sql = "
    SELECT
        {$pageCase} as pagina,
        COUNT(*)                            as visitas,
        COUNT(DISTINCT pv.user_id)          as usuarios,
        ROUND(AVG(pv.time_on_page))         as tiempo_medio,
        ROUND(AVG(pv.scroll_depth))         as scroll_medio
    FROM av_pageviews pv
    WHERE pv.created_at >= DATE_SUB(NOW(), INTERVAL {$range} DAY)
    GROUP BY pagina
    ORDER BY visitas DESC
    LIMIT 10
";
$pages_curr = rows($conexion, $sql);

// Periodo anterior para comparativa
$sql_prev = "
    SELECT {$pageCase} as pagina, COUNT(*) as visitas
    FROM av_pageviews pv
    WHERE pv.created_at BETWEEN DATE_SUB(NOW(), INTERVAL ".($range*2)." DAY) AND DATE_SUB(NOW(), INTERVAL {$range} DAY)
    GROUP BY pagina
";
$pages_prev_map = [];
foreach (rows($conexion, $sql_prev) as $r) $pages_prev_map[$r['pagina']] = (int)$r['visitas'];

$out['paginas'] = array_map(function($r) use ($pages_prev_map) {
    $prev = $pages_prev_map[$r['pagina']] ?? 0;
    $curr = (int)$r['visitas'];
    $trend = $prev > 0 ? round(($curr - $prev) / $prev * 100, 1) : null;
    return [
        'pagina'      => $r['pagina'],
        'visitas'     => $curr,
        'visitas_prev'=> $prev,
        'usuarios'    => (int)$r['usuarios'],
        'tiempo_medio'=> (int)$r['tiempo_medio'],
        'scroll_medio'=> (int)$r['scroll_medio'],
        'trend'       => $trend,
    ];
}, $pages_curr);

// ── 7. Eventos personalizados ─────────────────────────────────────────────────

// Totales por tipo
$out['eventos_tipo'] = array_map(fn($r) => ['name' => $r['event_type'], 'value' => (int)$r['total']],
    rows($conexion, "SELECT event_type, COUNT(*) as total FROM av_events e WHERE e.created_at >= DATE_SUB(NOW(), INTERVAL {$range} DAY) GROUP BY event_type ORDER BY total DESC")
);

// Top eventos por label
$out['eventos_top'] = array_map(fn($r) => ['tipo' => $r['event_type'], 'label' => $r['event_label'], 'total' => (int)$r['total']],
    rows($conexion, "SELECT event_type, event_label, COUNT(*) as total FROM av_events e WHERE e.created_at >= DATE_SUB(NOW(), INTERVAL {$range} DAY) GROUP BY event_type, event_label ORDER BY total DESC LIMIT 10")
);

// Eventos en el tiempo
$sql = "
    SELECT {$dateGroupEv} as label, event_type, COUNT(*) as total
    FROM av_events e
    WHERE e.created_at >= DATE_SUB(NOW(), INTERVAL {$range} DAY)
    GROUP BY label, event_type
    ORDER BY MIN(e.created_at) ASC
";
$evs_raw = rows($conexion, $sql);
$evs_map = [];
foreach ($evs_raw as $r) {
    $l = $r['label'];
    if (!isset($evs_map[$l])) $evs_map[$l] = ['label' => $l];
    $evs_map[$l][$r['event_type']] = (int)$r['total'];
}
$out['eventos_tiempo'] = array_values($evs_map);

// Scroll medio por página
$out['scroll_paginas'] = array_map(fn($r) => ['pagina' => $r['pagina'], 'scroll' => (int)$r['scroll_medio']],
    rows($conexion, "SELECT {$pageCase} as pagina, ROUND(AVG(pv.scroll_depth)) as scroll_medio FROM av_pageviews pv WHERE pv.created_at >= DATE_SUB(NOW(), INTERVAL {$range} DAY) AND pv.scroll_depth > 0 GROUP BY pagina ORDER BY scroll_medio DESC")
);

// ── 8. Sin datos flag ──────────────────────────────────────────────────────────

$out['has_data'] = ($pv_total > 0 || $ses_curr > 0);

echo json_encode($out, JSON_UNESCAPED_UNICODE);

mysqli_close($conexion);

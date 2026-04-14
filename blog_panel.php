<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once "conexion.php";

$method = $_SERVER['REQUEST_METHOD'];
$body   = json_decode(file_get_contents("php://input"), true) ?? [];

switch ($method) {

    // ── GET: listar todos (panel, sin filtro de publicado) ──────────────────
    case 'GET':
        $result = mysqli_query($conexion,
            "SELECT * FROM blog_posts ORDER BY fecha DESC, creado_en DESC"
        );
        if (!$result) {
            http_response_code(500);
            echo json_encode(["error" => mysqli_error($conexion)]);
            exit;
        }
        $posts = [];
        while ($row = mysqli_fetch_assoc($result)) {
            // Normalizar booleanos que MySQL devuelve como "0"/"1"
            $row['publicado']  = (bool) $row['publicado'];
            $row['destacado']  = (bool) $row['destacado'];
            $posts[] = $row;
        }
        echo json_encode($posts);
        break;

    // ── POST: crear ─────────────────────────────────────────────────────────
    case 'POST':
        $titulo    = trim($body['titulo']    ?? '');
        $slug      = trim($body['slug']      ?? '');
        $categoria = trim($body['categoria'] ?? 'General');
        $resumen   = trim($body['resumen']   ?? '');
        $contenido = trim($body['contenido'] ?? '');
        $emoji     = trim($body['emoji']     ?? '🛠️');
        $destacado = isset($body['destacado']) && $body['destacado'] ? 1 : 0;
        $publicado = isset($body['publicado']) && $body['publicado'] ? 1 : 0;
        $fecha     = trim($body['fecha']     ?? date('Y-m-d'));

        if ($titulo === '' || $contenido === '') {
            http_response_code(400);
            echo json_encode(["error" => "Título y contenido son obligatorios."]);
            exit;
        }

        // Slug único: añadir sufijo si ya existe
        $slug_base = $slug !== '' ? $slug : slugify($titulo);
        $slug_final = unique_slug($conexion, $slug_base);

        $stmt = mysqli_prepare($conexion,
            "INSERT INTO blog_posts
             (titulo, slug, categoria, resumen, contenido, emoji, destacado, publicado, fecha)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        mysqli_stmt_bind_param($stmt, 'ssssssiis',
            $titulo, $slug_final, $categoria, $resumen, $contenido,
            $emoji, $destacado, $publicado, $fecha
        );

        if (!mysqli_stmt_execute($stmt)) {
            http_response_code(500);
            echo json_encode(["error" => mysqli_stmt_error($stmt)]);
            exit;
        }
        echo json_encode(["id" => mysqli_insert_id($conexion), "slug" => $slug_final, "success" => true]);
        break;

    // ── PUT: actualizar ──────────────────────────────────────────────────────
    case 'PUT':
        $id        = intval($body['id'] ?? 0);
        $titulo    = trim($body['titulo']    ?? '');
        $slug      = trim($body['slug']      ?? '');
        $categoria = trim($body['categoria'] ?? 'General');
        $resumen   = trim($body['resumen']   ?? '');
        $contenido = trim($body['contenido'] ?? '');
        $emoji     = trim($body['emoji']     ?? '🛠️');
        $destacado = isset($body['destacado']) && $body['destacado'] ? 1 : 0;
        $publicado = isset($body['publicado']) && $body['publicado'] ? 1 : 0;
        $fecha     = trim($body['fecha']     ?? date('Y-m-d'));

        if ($id === 0 || $titulo === '' || $contenido === '') {
            http_response_code(400);
            echo json_encode(["error" => "ID, título y contenido son obligatorios."]);
            exit;
        }

        // Slug único excluyendo el propio registro
        $slug_base  = $slug !== '' ? $slug : slugify($titulo);
        $slug_final = unique_slug($conexion, $slug_base, $id);

        $stmt = mysqli_prepare($conexion,
            "UPDATE blog_posts SET
             titulo=?, slug=?, categoria=?, resumen=?, contenido=?,
             emoji=?, destacado=?, publicado=?, fecha=?
             WHERE id=?"
        );
        mysqli_stmt_bind_param($stmt, 'ssssssiisd',
            $titulo, $slug_final, $categoria, $resumen, $contenido,
            $emoji, $destacado, $publicado, $fecha, $id
        );

        if (!mysqli_stmt_execute($stmt)) {
            http_response_code(500);
            echo json_encode(["error" => mysqli_stmt_error($stmt)]);
            exit;
        }
        echo json_encode(["success" => true, "slug" => $slug_final]);
        break;

    // ── DELETE ───────────────────────────────────────────────────────────────
    case 'DELETE':
        $id = intval($body['id'] ?? 0);
        if ($id === 0) {
            http_response_code(400);
            echo json_encode(["error" => "ID inválido."]);
            exit;
        }
        $stmt = mysqli_prepare($conexion, "DELETE FROM blog_posts WHERE id=?");
        mysqli_stmt_bind_param($stmt, 'i', $id);
        if (!mysqli_stmt_execute($stmt)) {
            http_response_code(500);
            echo json_encode(["error" => mysqli_stmt_error($stmt)]);
            exit;
        }
        echo json_encode(["success" => true]);
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Método no permitido."]);
}

mysqli_close($conexion);

// ── Helpers ──────────────────────────────────────────────────────────────────

function slugify(string $text): string {
    $text = mb_strtolower($text, 'UTF-8');
    $text = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text);
    $text = preg_replace('/[^a-z0-9\s-]/', '', $text);
    $text = preg_replace('/[\s-]+/', '-', trim($text));
    return $text ?: 'post';
}

function unique_slug($conexion, string $base, int $exclude_id = 0): string {
    $slug    = $base;
    $counter = 1;
    while (true) {
        $escaped = mysqli_real_escape_string($conexion, $slug);
        $q = $exclude_id > 0
            ? "SELECT id FROM blog_posts WHERE slug='$escaped' AND id != $exclude_id LIMIT 1"
            : "SELECT id FROM blog_posts WHERE slug='$escaped' LIMIT 1";
        $r = mysqli_query($conexion, $q);
        if (mysqli_num_rows($r) === 0) return $slug;
        $slug = $base . '-' . $counter++;
    }
}

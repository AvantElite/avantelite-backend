<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once "conexion.php";

$categoria = isset($_GET['categoria']) ? mysqli_real_escape_string($conexion, $_GET['categoria']) : '';
$slug      = isset($_GET['slug'])      ? mysqli_real_escape_string($conexion, $_GET['slug'])      : '';
$destacado = isset($_GET['destacado']) ? 1 : null;

// Artículo individual por slug
if ($slug !== '') {
    $sql = "SELECT * FROM blog_posts WHERE slug = '$slug' AND publicado = 1 LIMIT 1";
    $result = mysqli_query($conexion, $sql);
    if (!$result) {
        http_response_code(500);
        echo json_encode(["error" => mysqli_error($conexion)]);
        exit;
    }
    $post = mysqli_fetch_assoc($result);
    echo $post ? json_encode($post) : json_encode(["error" => "No encontrado"]);
    exit;
}

// Listado
$where = ["publicado = 1"];
if ($categoria !== '') $where[] = "categoria = '$categoria'";
if ($destacado !== null) $where[] = "destacado = 1";

$where_sql = implode(" AND ", $where);
$sql = "SELECT id, titulo, slug, categoria, resumen, emoji, destacado, fecha
        FROM blog_posts
        WHERE $where_sql
        ORDER BY destacado DESC, fecha DESC";

$result = mysqli_query($conexion, $sql);
if (!$result) {
    http_response_code(500);
    echo json_encode(["error" => mysqli_error($conexion)]);
    exit;
}

$posts = [];
while ($row = mysqli_fetch_assoc($result)) {
    $posts[] = $row;
}

echo json_encode($posts);
mysqli_close($conexion);
?>

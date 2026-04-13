<?php
// Reportar errores (solo desarrollo)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Configurar cabeceras CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Incluir conexión a la base de datos
include 'conexion.php';

// Si es una preflight request OPTIONS, terminamos aquí
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$contactos = array();
$sql = "SELECT * FROM contactos ORDER BY fecha_creacion DESC";
$result = mysqli_query($conexion, $sql);

if ($result) {
    while($row = mysqli_fetch_assoc($result)) {
        // Aseguramos que 'leido' sea boolean para el frontend React
        $row['leido'] = (bool) (isset($row['leido']) && $row['leido'] == 1);
        $contactos[] = $row;
    }
    http_response_code(200);
    echo json_encode($contactos);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Error al obtener contactos: " . mysqli_error($conexion)]);
}

mysqli_close($conexion);
?>

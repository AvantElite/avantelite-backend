<?php
// Configuración de errores
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Cabeceras CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

include 'conexion.php';

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $stats = [];

    // 1. Totales Generales
    $resTotal = mysqli_query($conexion, "SELECT COUNT(*) as total FROM contactos");
    $rowTotal = mysqli_fetch_assoc($resTotal);
    $stats['total_contactos'] = (int) $rowTotal['total'];

    // 2. Nuevos (sin leer)
    $resNuevos = mysqli_query($conexion, "SELECT COUNT(*) as nuevos FROM contactos WHERE leido = 0");
    $rowNuevos = mysqli_fetch_assoc($resNuevos);
    $stats['nuevos_contactos'] = (int) $rowNuevos['nuevos'];

    // 2.1 Leídos (Total)
    $resLeidos = mysqli_query($conexion, "SELECT COUNT(*) as leidos FROM contactos WHERE leido = 1");
    $rowLeidos = mysqli_fetch_assoc($resLeidos);
    $stats['leidos_contactos'] = (int) $rowLeidos['leidos'];

    // 3. Distribución por Producto
    $resProd = mysqli_query($conexion, "SELECT producto as name, COUNT(*) as value FROM contactos GROUP BY producto");
    $distribucion = [];
    while ($row = mysqli_fetch_assoc($resProd)) {
        $distribucion[] = [
            'name' => $row['name'],
            'value' => (int) $row['value']
        ];
    }
    $stats['distribucion_producto'] = $distribucion;

    // 4. Actividad Reciente (Top 8)
    $resReciente = mysqli_query($conexion, "SELECT nombre, apellido, producto, problema, fecha_creacion, leido FROM contactos ORDER BY fecha_creacion DESC LIMIT 8");
    $reciente = [];
    while ($row = mysqli_fetch_assoc($resReciente)) {
        $reciente[] = [
            'name' => $row['nombre'] . ' ' . $row['apellido'],
            'action' => $row['problema'],
            'producto' => $row['producto'],
            'time' => $row['fecha_creacion'],
            'status' => $row['leido'] == 0 ? 'Nuevo' : 'Leído'
        ];
    }
    $stats['actividad_reciente'] = $reciente;

    // 5. Volumen Mensual (Últimos 12 meses)
    $sqlMensual = "SELECT 
                    DATE_FORMAT(fecha_creacion, '%b') as mes, 
                    COUNT(*) as recibidos,
                    SUM(CASE WHEN leido = 1 THEN 1 ELSE 0 END) as leidos
                   FROM contactos 
                   WHERE fecha_creacion > DATE_SUB(NOW(), INTERVAL 12 MONTH)
                   GROUP BY MONTH(fecha_creacion)
                   ORDER BY fecha_creacion ASC";
    $resMensual = mysqli_query($conexion, $sqlMensual);
    $mensual = [];
    while ($row = mysqli_fetch_assoc($resMensual)) {
        $mensual[] = [
            'mes' => $row['mes'],
            'recibidos' => (int) $row['recibidos'],
            'leidos' => (int) $row['leidos']
        ];
    }
    $stats['volumen_mensual'] = $mensual;

    // 6. Contactos Diarios (Últimos 7 días)
    $sqlDiario = "SELECT 
                    DATE_FORMAT(fecha_creacion, '%a') as dia, 
                    COUNT(*) as contactos
                   FROM contactos 
                   WHERE fecha_creacion > DATE_SUB(NOW(), INTERVAL 7 DAY)
                   GROUP BY DATE(fecha_creacion)
                   ORDER BY fecha_creacion ASC";
    $resDiario = mysqli_query($conexion, $sqlDiario);
    $diario = [];
    // Nombres de días en español para el front
    $diasEsp = ['Mon' => 'Lun', 'Tue' => 'Mar', 'Wed' => 'Mie', 'Thu' => 'Jue', 'Fri' => 'Vie', 'Sat' => 'Sab', 'Sun' => 'Dom'];
    while ($row = mysqli_fetch_assoc($resDiario)) {
        $diario[] = [
            'dia' => isset($diasEsp[$row['dia']]) ? $diasEsp[$row['dia']] : $row['dia'],
            'contactos' => (int) $row['contactos']
        ];
    }
    $stats['contactos_diarios'] = $diario;

    echo json_encode($stats);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}

mysqli_close($conexion);
?>

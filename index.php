<?php
// ACTIVAR REPORTE DE ERRORES (Solo para desarrollo)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// 1. Incluimos la conexión a la base de datos
include 'conexion.php';

// 2. Solo procesamos si el formulario se envió por el método POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // 3. Recogemos los datos y los limpiamos
    $nombre = mysqli_real_escape_string($conexion, $_POST['nombre'] ?? '');
    $apellido = mysqli_real_escape_string($conexion, $_POST['apellido'] ?? '');
    $email = mysqli_real_escape_string($conexion, $_POST['email'] ?? '');
    $telefono = mysqli_real_escape_string($conexion, $_POST['telefono'] ?? '');
    $producto = mysqli_real_escape_string($conexion, $_POST['producto'] ?? 'General');
    $problema = mysqli_real_escape_string($conexion, $_POST['problema'] ?? '');
    $mensaje = mysqli_real_escape_string($conexion, $_POST['mensaje'] ?? '');

    // 4. Detectamos el origen
    $origen = mysqli_real_escape_string($conexion, $_POST['origen_sitio'] ?? 'AVANTSTORE');

    // 5. Preparamos la sentencia de inserción
    $sql = "INSERT INTO contactos (nombre, apellido, email, telefono, producto, problema, mensaje, origen) 
            VALUES ('$nombre', '$apellido', '$email', '$telefono', '$producto', '$problema', '$mensaje', '$origen')";

    // 6. Ejecutamos la consulta
    if (mysqli_query($conexion, $sql)) {
        // REDIRECCIÓN A TU NUEVA PÁGINA DE ÉXITO
        header("Location: http://127.0.0.1:5500/success.html");
        exit();
    } else {
        // ERROR: Mostramos el error exacto de MySQL si algo falla
        echo "Error en la base de datos: " . mysqli_error($conexion);
    }
}

// 7. Cerramos la conexión al terminar
mysqli_close($conexion);
?>
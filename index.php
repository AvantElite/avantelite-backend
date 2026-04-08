<?php
// 1. Incluimos la conexión a la base de datos
include 'conexion.php';

// 2. Solo procesamos si el formulario se envió por el método POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // 3. Recogemos los datos y los limpiamos para evitar errores de SQL (SQL Injection)
    $nombre = mysqli_real_escape_string($conexion, $_POST['nombre'] ?? '');
    $apellido = mysqli_real_escape_string($conexion, $_POST['apellido'] ?? '');
    $email = mysqli_real_escape_string($conexion, $_POST['email'] ?? '');
    $telefono = mysqli_real_escape_string($conexion, $_POST['telefono'] ?? '');
    $producto = mysqli_real_escape_string($conexion, $_POST['producto'] ?? 'General');
    $problema = mysqli_real_escape_string($conexion, $_POST['problema'] ?? '');
    $mensaje = mysqli_real_escape_string($conexion, $_POST['mensaje'] ?? '');

    // 4. Detectamos el origen enviado desde el input 'hidden' del HTML
    // Si no se envía nada, por defecto guardará 'AVANTSTORE'
    $origen = mysqli_real_escape_string($conexion, $_POST['origen_sitio'] ?? 'AVANTSTORE');

    // 5. Preparamos la sentencia de inserción
    $sql = "INSERT INTO contactos (nombre, apellido, email, telefono, producto, problema, mensaje, origen) 
            VALUES ('$nombre', '$apellido', '$email', '$telefono', '$producto', '$problema', '$mensaje', '$origen')";

    // 6. Ejecutamos la consulta
    if (mysqli_query($conexion, $sql)) {
        // ÉXITO: Redirigimos de vuelta a la tienda con un parámetro de éxito
        header("Location: store.html?status=success#contacto");
        exit();
    } else {
        // ERROR: Mostramos el error exacto de MySQL si algo falla
        echo "Error en la base de datos: " . mysqli_error($conexion);
    }
}

// 7. Cerramos la conexión al terminar
mysqli_close($conexion);
?>
<?php
include 'conexion.php';

// Solo actuamos si se envían datos por POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // Recogemos los datos usando el operador de fusión de nulidad (??) 
    // Esto evita errores si algún campo no llega en el POST
    $nombre = mysqli_real_escape_string($conexion, $_POST['nombre'] ?? '');
    $apellido = mysqli_real_escape_string($conexion, $_POST['apellido'] ?? '');
    $email = mysqli_real_escape_string($conexion, $_POST['email'] ?? '');
    $telefono = mysqli_real_escape_string($conexion, $_POST['telefono'] ?? '');
    $producto = mysqli_real_escape_string($conexion, $_POST['producto'] ?? 'General');
    $problema = mysqli_real_escape_string($conexion, $_POST['problema'] ?? '');
    $mensaje = mysqli_real_escape_string($conexion, $_POST['mensaje'] ?? '');

    // Definimos el origen (útil si luego creas AvantService, AvantTienda, etc.)
    $origen = "AVANTSTORE";

    // Preparamos la consulta SQL
    $sql = "INSERT INTO contactos (nombre, apellido, email, telefono, producto, problema, mensaje, origen) 
            VALUES ('$nombre', '$apellido', '$email', '$telefono', '$producto', '$problema', '$mensaje', '$origen')";

    if (mysqli_query($conexion, $sql)) {
        // ÉXITO: Redirigimos al usuario a la página principal.
        // He añadido 'exit' después del header para detener la ejecución del script.
        header("Location: ../index.html?status=success#contacto");
        exit();
    } else {
        // ERROR: Mostramos el error (en producción esto deberías guardarlo en un log en vez de mostrarlo)
        echo "Error al guardar los datos: " . mysqli_error($conexion);
    }
}

// Cerramos la conexión
mysqli_close($conexion);
?>
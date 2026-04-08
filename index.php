<?php
include 'conexion.php';

// Solo actuamos si se envían datos por POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // Recogemos y limpiamos los datos para evitar inyecciones básicos
    $nombre = mysqli_real_escape_string($conexion, $_POST['nombre']);
    $apellido = mysqli_real_escape_string($conexion, $_POST['apellido']);
    $email = mysqli_real_escape_string($conexion, $_POST['email']);
    $telefono = mysqli_real_escape_string($conexion, $_POST['telefono']);
    $producto = mysqli_real_escape_string($conexion, $_POST['producto']);
    $problema = mysqli_real_escape_string($conexion, $_POST['problema']);
    $mensaje = mysqli_real_escape_string($conexion, $_POST['mensaje']);

    $sql = "INSERT INTO contactos (nombre, apellido, email, telefono, producto, problema, mensaje) 
            VALUES ('$nombre', '$apellido', '$email', '$telefono', '$producto', '$problema', '$mensaje')";

    if (mysqli_query($conexion, $sql)) {
        // Si sale bien, redirigimos de vuelta con un mensaje de éxito
        header("Location: ../index.html?enviado=exito");
    } else {
        echo "Error: " . $sql . "<br>" . mysqli_error($conexion);
    }
}
mysqli_close($conexion);
?>
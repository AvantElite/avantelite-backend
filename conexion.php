<?php
$host = "localhost";
$user = "root";
$pass = ""; // En WampServer por defecto está vacío
$db = "backendavant";

$conexion = mysqli_connect($host, $user, $pass, $db);

if (!$conexion) {
    die("Error de conexión: " . mysqli_connect_error());
}
?>
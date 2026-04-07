-- ============================================
-- Base de datos para AvantService
-- Ejecutar este script en MySQL/phpMyAdmin
-- para crear la base de datos y la tabla
-- ============================================

CREATE DATABASE IF NOT EXISTS avantservice
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE avantservice;

-- Tabla para almacenar los mensajes del formulario de contacto
CREATE TABLE IF NOT EXISTS contactos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    leido TINYINT(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

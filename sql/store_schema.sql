-- =============================================
-- TIENDA: tablas de productos, usuarios, carrito y analíticas de tienda
-- Se ejecutan en la misma BD que el resto de avantelite-backend.
-- =============================================

CREATE TABLE IF NOT EXISTS store_usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS store_productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(200) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    categoria_id INT DEFAULT NULL,
    stock INT DEFAULT 0,
    eficiencia_energetica VARCHAR(10) DEFAULT NULL,
    imagen_url VARCHAR(500) DEFAULT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS store_especificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    nombre_dato VARCHAR(150) NOT NULL,
    valor_dato VARCHAR(500) NOT NULL,
    INDEX idx_producto (producto_id),
    FOREIGN KEY (producto_id) REFERENCES store_productos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS store_carrito (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    producto_id INT NOT NULL,
    producto_nombre VARCHAR(200) NOT NULL,
    producto_marca VARCHAR(100) NOT NULL,
    producto_precio DECIMAL(10,2) NOT NULL,
    producto_imagen VARCHAR(500) DEFAULT '',
    cantidad INT DEFAULT 1,
    fecha_agregado DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuario (usuario_id),
    FOREIGN KEY (usuario_id) REFERENCES store_usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS store_sesiones (
    id VARCHAR(64) PRIMARY KEY,
    inicio DATETIME NOT NULL,
    fin DATETIME NULL,
    duracion_seg INT DEFAULT 0,
    paginas_vistas INT DEFAULT 1,
    rebote TINYINT(1) DEFAULT 1,
    dispositivo ENUM('mobile','desktop','tablet') DEFAULT 'desktop',
    pais VARCHAR(80) DEFAULT 'Desconocido',
    ciudad VARCHAR(120) DEFAULT NULL,
    fuente ENUM('organic','direct','social','paid','referral') DEFAULT 'direct',
    utm_source VARCHAR(100) DEFAULT NULL,
    utm_medium VARCHAR(100) DEFAULT NULL,
    utm_campaign VARCHAR(100) DEFAULT NULL,
    referrer VARCHAR(500) DEFAULT NULL,
    user_agent VARCHAR(500) DEFAULT NULL,
    ip VARCHAR(45) DEFAULT NULL,
    INDEX idx_inicio (inicio),
    INDEX idx_fuente (fuente),
    INDEX idx_dispositivo (dispositivo),
    INDEX idx_pais (pais)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS store_visitas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    fecha DATETIME NOT NULL,
    pagina VARCHAR(300) NOT NULL,
    titulo VARCHAR(300) DEFAULT NULL,
    tiempo_seg INT DEFAULT 0,
    INDEX idx_session (session_id),
    INDEX idx_fecha (fecha),
    INDEX idx_pagina (pagina(100)),
    FOREIGN KEY (session_id) REFERENCES store_sesiones(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS store_eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    fecha DATETIME NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    pagina VARCHAR(300) DEFAULT NULL,
    valor VARCHAR(250) DEFAULT NULL,
    INDEX idx_tipo (tipo),
    INDEX idx_fecha (fecha),
    INDEX idx_nombre (nombre),
    FOREIGN KEY (session_id) REFERENCES store_sesiones(id) ON DELETE CASCADE
) ENGINE=InnoDB;

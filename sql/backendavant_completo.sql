-- ============================================================
--  backendavant_completo.sql
--  Base de datos unificada para AvantService / AvantElite
--  Importar directamente en phpMyAdmin (WAMP) y listo.
--  Generado: 2026-05-04
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS `backendavant`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `backendavant`;

START TRANSACTION;

-- ============================================================
--  USUARIOS (web principal)
-- ============================================================
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id`              INT            NOT NULL AUTO_INCREMENT,
  `nombre`          VARCHAR(100)   NOT NULL,
  `email`           VARCHAR(150)   NOT NULL,
  `password`        VARCHAR(255)   NOT NULL,
  `fecha_registro`  DATETIME       DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  PRODUCTOS (web principal)
-- ============================================================
CREATE TABLE IF NOT EXISTS `productos` (
  `id`                    INT            NOT NULL AUTO_INCREMENT,
  `marca`                 VARCHAR(100)   NOT NULL,
  `modelo`                VARCHAR(200)   NOT NULL,
  `precio`                DECIMAL(10,2)  NOT NULL,
  `categoria_id`          INT            DEFAULT NULL,
  `stock`                 INT            DEFAULT 0,
  `eficiencia_energetica` VARCHAR(10)    DEFAULT NULL,
  `imagen_url`            VARCHAR(500)   DEFAULT NULL,
  `fecha_creacion`        DATETIME       DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  ESPECIFICACIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS `especificaciones` (
  `id`          INT           NOT NULL AUTO_INCREMENT,
  `producto_id` INT           NOT NULL,
  `nombre_dato` VARCHAR(150)  NOT NULL,
  `valor_dato`  VARCHAR(500)  NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_producto` (`producto_id`),
  CONSTRAINT `especificaciones_ibfk_1`
    FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  CARRITO
-- ============================================================
CREATE TABLE IF NOT EXISTS `carrito` (
  `id`               INT            NOT NULL AUTO_INCREMENT,
  `usuario_id`       INT            NOT NULL,
  `producto_id`      INT            NOT NULL,
  `producto_nombre`  VARCHAR(200)   NOT NULL,
  `producto_marca`   VARCHAR(100)   NOT NULL,
  `producto_precio`  DECIMAL(10,2)  NOT NULL,
  `producto_imagen`  VARCHAR(500)   DEFAULT '',
  `cantidad`         INT            DEFAULT 1,
  `fecha_agregado`   DATETIME       DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `carrito_ibfk_1`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  CONTACTOS (formulario AvantService)
-- ============================================================
CREATE TABLE IF NOT EXISTS `contactos` (
  `id`             INT           NOT NULL AUTO_INCREMENT,
  `nombre`         VARCHAR(100)  NOT NULL,
  `apellido`       VARCHAR(100)  NOT NULL DEFAULT '',
  `email`          VARCHAR(150)  NOT NULL,
  `telefono`       VARCHAR(30)   DEFAULT NULL,
  `producto`       VARCHAR(200)  DEFAULT NULL,
  `problema`       VARCHAR(100)  DEFAULT NULL,
  `mensaje`        TEXT          DEFAULT NULL,
  `origen`         VARCHAR(50)   DEFAULT 'AVANTSERVICE',
  `tipo`           ENUM('formulario','diy') NOT NULL DEFAULT 'formulario',
  `dificultad`     ENUM('facil','medio','dificil') DEFAULT NULL,
  `leido`          TINYINT(1)    DEFAULT 0,
  `fecha_leido`    DATETIME      NULL DEFAULT NULL,
  `fecha_creacion` DATETIME      DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  PRESUPUESTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS `presupuestos` (
  `id`              INT AUTO_INCREMENT PRIMARY KEY,
  `contacto_id`     INT NOT NULL,
  `token`           VARCHAR(64) NOT NULL UNIQUE,
  `lineas`          JSON NOT NULL,
  `total`           DECIMAL(10,2) NOT NULL,
  `mensaje`         TEXT,
  `notas`           TEXT,
  `estado`          ENUM('pendiente','aceptado','rechazado') NOT NULL DEFAULT 'pendiente',
  `fecha_creacion`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_respuesta` DATETIME NULL,
  FOREIGN KEY (`contacto_id`) REFERENCES `contactos`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  BLOG_POSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS `blog_posts` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `titulo`      VARCHAR(300)  NOT NULL,
  `slug`        VARCHAR(300)  NOT NULL,
  `categoria`   VARCHAR(100)  DEFAULT 'General',
  `resumen`     TEXT          DEFAULT NULL,
  `contenido`   LONGTEXT      NOT NULL,
  `emoji`       VARCHAR(20)   DEFAULT '🛠️',
  `destacado`   TINYINT(1)    DEFAULT 0,
  `publicado`   TINYINT(1)    DEFAULT 1,
  `fecha`       DATE          DEFAULT (CURDATE()),
  `creado_en`   DATETIME      DEFAULT CURRENT_TIMESTAMP,
  `actualizado` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  RAG_KNOWLEDGE
-- ============================================================
CREATE TABLE IF NOT EXISTS `rag_knowledge` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `titulo`     VARCHAR(255)  NOT NULL,
  `contenido`  TEXT          NOT NULL,
  `categoria`  VARCHAR(100)  NOT NULL DEFAULT 'General',
  `created_at` TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  ANALYTICS — av_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS `av_sessions` (
  `id`           VARCHAR(36)   NOT NULL,
  `user_id`      VARCHAR(36)   DEFAULT NULL,
  `ip`           VARCHAR(45)   DEFAULT NULL,
  `device_type`  VARCHAR(20)   DEFAULT 'desktop',
  `browser`      VARCHAR(80)   DEFAULT NULL,
  `os`           VARCHAR(80)   DEFAULT NULL,
  `screen_w`     SMALLINT      DEFAULT 0,
  `screen_h`     SMALLINT      DEFAULT 0,
  `country`      VARCHAR(80)   DEFAULT NULL,
  `region`       VARCHAR(80)   DEFAULT NULL,
  `city`         VARCHAR(120)  DEFAULT NULL,
  `referrer`     VARCHAR(500)  DEFAULT NULL,
  `landing_page` VARCHAR(500)  DEFAULT NULL,
  `utm_source`   VARCHAR(100)  DEFAULT NULL,
  `utm_medium`   VARCHAR(100)  DEFAULT NULL,
  `utm_campaign` VARCHAR(100)  DEFAULT NULL,
  `utm_content`  VARCHAR(100)  DEFAULT NULL,
  `utm_term`     VARCHAR(100)  DEFAULT NULL,
  `page_count`   INT           DEFAULT 1,
  `created_at`   DATETIME      DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_created` (`created_at`),
  KEY `idx_user`    (`user_id`),
  KEY `idx_country` (`country`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  ANALYTICS — av_pageviews
-- ============================================================
CREATE TABLE IF NOT EXISTS `av_pageviews` (
  `id`           INT           NOT NULL AUTO_INCREMENT,
  `session_id`   VARCHAR(36)   NOT NULL,
  `user_id`      VARCHAR(36)   DEFAULT NULL,
  `page`         VARCHAR(500)  NOT NULL,
  `page_title`   VARCHAR(300)  DEFAULT NULL,
  `referrer`     VARCHAR(500)  DEFAULT NULL,
  `time_on_page` INT           DEFAULT 0,
  `scroll_depth` TINYINT       DEFAULT 0,
  `created_at`   DATETIME      DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_session` (`session_id`),
  KEY `idx_user`    (`user_id`),
  KEY `idx_created` (`created_at`),
  KEY `idx_page`    (`page`(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  ANALYTICS — av_events
-- ============================================================
CREATE TABLE IF NOT EXISTS `av_events` (
  `id`          INT           NOT NULL AUTO_INCREMENT,
  `session_id`  VARCHAR(36)   NOT NULL,
  `user_id`     VARCHAR(36)   DEFAULT NULL,
  `page`        VARCHAR(500)  DEFAULT NULL,
  `event_type`  VARCHAR(50)   NOT NULL,
  `event_label` VARCHAR(200)  DEFAULT NULL,
  `event_value` VARCHAR(200)  DEFAULT NULL,
  `created_at`  DATETIME      DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_session` (`session_id`),
  KEY `idx_type`    (`event_type`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  TIENDA — store_categorias
-- ============================================================
CREATE TABLE IF NOT EXISTS `store_categorias` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `nombre`         VARCHAR(150) NOT NULL UNIQUE,
  `slug`           VARCHAR(180) DEFAULT NULL,
  `descripcion`    VARCHAR(500) DEFAULT NULL,
  `parent_id`      INT          DEFAULT NULL,
  `fecha_creacion` DATETIME     DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_parent` (`parent_id`),
  FOREIGN KEY (`parent_id`) REFERENCES `store_categorias`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  TIENDA — store_usuarios
-- ============================================================
CREATE TABLE IF NOT EXISTS `store_usuarios` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `nombre`         VARCHAR(100) NOT NULL,
  `email`          VARCHAR(150) NOT NULL UNIQUE,
  `password`       VARCHAR(255) NOT NULL,
  `fecha_registro` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  TIENDA — store_productos
-- ============================================================
CREATE TABLE IF NOT EXISTS `store_productos` (
  `id`                    INT AUTO_INCREMENT PRIMARY KEY,
  `marca`                 VARCHAR(100) NOT NULL,
  `modelo`                VARCHAR(200) NOT NULL,
  `precio`                DECIMAL(10,2) NOT NULL,
  `categoria_id`          INT DEFAULT NULL,
  `stock`                 INT DEFAULT 0,
  `eficiencia_energetica` VARCHAR(10) DEFAULT NULL,
  `imagen_url`            VARCHAR(500) DEFAULT NULL,
  `fecha_creacion`        DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_store_productos_categoria`
    FOREIGN KEY (`categoria_id`) REFERENCES `store_categorias`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  TIENDA — store_especificaciones
-- ============================================================
CREATE TABLE IF NOT EXISTS `store_especificaciones` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `producto_id` INT NOT NULL,
  `nombre_dato` VARCHAR(150) NOT NULL,
  `valor_dato`  VARCHAR(500) NOT NULL,
  INDEX `idx_producto` (`producto_id`),
  FOREIGN KEY (`producto_id`) REFERENCES `store_productos`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  TIENDA — store_carrito
-- ============================================================
CREATE TABLE IF NOT EXISTS `store_carrito` (
  `id`               INT AUTO_INCREMENT PRIMARY KEY,
  `usuario_id`       INT NOT NULL,
  `producto_id`      INT NOT NULL,
  `producto_nombre`  VARCHAR(200) NOT NULL,
  `producto_marca`   VARCHAR(100) NOT NULL,
  `producto_precio`  DECIMAL(10,2) NOT NULL,
  `producto_imagen`  VARCHAR(500) DEFAULT '',
  `cantidad`         INT DEFAULT 1,
  `fecha_agregado`   DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_usuario` (`usuario_id`),
  FOREIGN KEY (`usuario_id`) REFERENCES `store_usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  TIENDA — store_sesiones
-- ============================================================
CREATE TABLE IF NOT EXISTS `store_sesiones` (
  `id`             VARCHAR(64) PRIMARY KEY,
  `inicio`         DATETIME NOT NULL,
  `fin`            DATETIME NULL,
  `duracion_seg`   INT DEFAULT 0,
  `paginas_vistas` INT DEFAULT 1,
  `rebote`         TINYINT(1) DEFAULT 1,
  `dispositivo`    ENUM('mobile','desktop','tablet') DEFAULT 'desktop',
  `pais`           VARCHAR(80) DEFAULT 'Desconocido',
  `ciudad`         VARCHAR(120) DEFAULT NULL,
  `fuente`         ENUM('organic','direct','social','paid','referral') DEFAULT 'direct',
  `utm_source`     VARCHAR(100) DEFAULT NULL,
  `utm_medium`     VARCHAR(100) DEFAULT NULL,
  `utm_campaign`   VARCHAR(100) DEFAULT NULL,
  `referrer`       VARCHAR(500) DEFAULT NULL,
  `user_agent`     VARCHAR(500) DEFAULT NULL,
  `ip`             VARCHAR(45) DEFAULT NULL,
  INDEX `idx_inicio` (`inicio`),
  INDEX `idx_fuente` (`fuente`),
  INDEX `idx_dispositivo` (`dispositivo`),
  INDEX `idx_pais` (`pais`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  TIENDA — store_visitas
-- ============================================================
CREATE TABLE IF NOT EXISTS `store_visitas` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `session_id` VARCHAR(64) NOT NULL,
  `fecha`      DATETIME NOT NULL,
  `pagina`     VARCHAR(300) NOT NULL,
  `titulo`     VARCHAR(300) DEFAULT NULL,
  `tiempo_seg` INT DEFAULT 0,
  INDEX `idx_session` (`session_id`),
  INDEX `idx_fecha` (`fecha`),
  INDEX `idx_pagina` (`pagina`(100)),
  FOREIGN KEY (`session_id`) REFERENCES `store_sesiones`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  TIENDA — store_eventos
-- ============================================================
CREATE TABLE IF NOT EXISTS `store_eventos` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `session_id` VARCHAR(64) NOT NULL,
  `fecha`      DATETIME NOT NULL,
  `tipo`       VARCHAR(50) NOT NULL,
  `nombre`     VARCHAR(150) NOT NULL,
  `pagina`     VARCHAR(300) DEFAULT NULL,
  `valor`      VARCHAR(250) DEFAULT NULL,
  INDEX `idx_tipo` (`tipo`),
  INDEX `idx_fecha` (`fecha`),
  INDEX `idx_nombre` (`nombre`),
  FOREIGN KEY (`session_id`) REFERENCES `store_sesiones`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  DATOS DE EJEMPLO
-- ============================================================

INSERT IGNORE INTO `usuarios` (`id`, `nombre`, `email`, `password`, `fecha_registro`) VALUES
(1, 'newtest1', 'newtest1@gmail.com', '$2y$10$H1fXrfUD9mVugH9bev6/AeTc0tk1Z3CYv9tpQiahDdoWV57MKZMnm', '2026-04-14 12:39:25');

INSERT IGNORE INTO `productos` (`id`, `marca`, `modelo`, `precio`, `categoria_id`, `stock`, `eficiencia_energetica`, `imagen_url`, `fecha_creacion`) VALUES
(1, 'NewTest', 'NewTest', 343.98, 2, 4444, 'A+++', '', '2026-04-14 12:34:14');

INSERT IGNORE INTO `carrito` (`id`, `usuario_id`, `producto_id`, `producto_nombre`, `producto_marca`, `producto_precio`, `producto_imagen`, `cantidad`, `fecha_agregado`) VALUES
(3, 1, 1, 'NewTest', 'NewTest', 343.98, 'img/no-photo.jpg', 1, '2026-04-14 12:40:10');

INSERT IGNORE INTO `blog_posts` (`titulo`, `slug`, `categoria`, `resumen`, `contenido`, `emoji`, `destacado`, `fecha`) VALUES
(
  '5 señales de que tu lavadora necesita revisión urgente',
  'senales-lavadora-revision-urgente',
  'Electrodomésticos',
  'Ruidos inusuales, fugas de agua o programas que no terminan son síntomas que no debes ignorar. Te explicamos qué significan y qué hacer.',
  '<p>Una lavadora que empieza a fallar suele avisarte antes de romperse del todo. Estos son los cinco síntomas más habituales:</p><ul><li><strong>Ruidos metálicos o golpes:</strong> pueden indicar que el tambor tiene una pieza suelta o que los amortiguadores están desgastados.</li><li><strong>Fugas de agua:</strong> revisa juntas y mangueras. Si la fuga viene del tambor, requiere técnico.</li><li><strong>Vibraciones excesivas:</strong> posible desequilibrio del tambor o patas desniveladas.</li><li><strong>Programas que no terminan:</strong> fallo en la electrónica o en la sonda de temperatura.</li><li><strong>Olor a quemado:</strong> llama a un técnico de inmediato, puede ser el motor.</li></ul>',
  '🧺', 1, '2026-04-10'
),
(
  '¿Por qué mi Smart TV va lento? Causas y soluciones',
  'smart-tv-lento-causas-soluciones',
  'Televisores',
  'Con el tiempo los televisores inteligentes pueden volverse lentos. Descubre por qué ocurre y cómo recuperar el rendimiento sin necesidad de cambiar el aparato.',
  '<p>El rendimiento de un Smart TV se degrada con el uso. Las causas más frecuentes son:</p><ul><li><strong>Memoria RAM saturada:</strong> demasiadas apps instaladas. Desinstala las que no uses.</li><li><strong>Software desactualizado:</strong> actualiza el firmware desde los ajustes del televisor.</li><li><strong>Caché acumulada:</strong> limpia la caché de las aplicaciones periódicamente.</li><li><strong>Conexión WiFi débil:</strong> usa cable Ethernet si es posible para mejor estabilidad.</li></ul><p>Si tras estos pasos sigue lento, puede ser un problema de hardware que requiere revisión técnica.</p>',
  '📺', 0, '2026-04-05'
),
(
  'Mantenimiento anual de calderas: qué incluye y por qué importa',
  'mantenimiento-anual-calderas',
  'Calderas',
  'Una revisión anual puede evitar averías costosas en invierno y garantizar la seguridad de toda la familia.',
  '<p>La revisión anual de la caldera es obligatoria en muchas comunidades autónomas y, sobre todo, es esencial para tu seguridad. Esto es lo que comprueba un técnico:</p><ul><li>Estado del quemador y electrodo de encendido</li><li>Presión del circuito hidráulico</li><li>Funcionamiento del termostato y válvulas de seguridad</li><li>Niveles de emisiones de CO₂</li><li>Estado de la chimenea o salida de humos</li></ul><p>Una caldera bien mantenida consume hasta un 15% menos de gas.</p>',
  '🔥', 0, '2026-03-28'
);

COMMIT;

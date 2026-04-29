-- ============================================================
--  backendavant_completo.sql
--  Base de datos unificada para AvantService
--  Generado: 2026-04-15
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS `backendavant`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE `backendavant`;

-- ============================================================
--  USUARIOS
-- ============================================================

CREATE TABLE IF NOT EXISTS `usuarios` (
  `id`              int            NOT NULL AUTO_INCREMENT,
  `nombre`          varchar(100)   NOT NULL,
  `email`           varchar(150)   NOT NULL,
  `password`        varchar(255)   NOT NULL,
  `fecha_registro`  datetime       DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  PRODUCTOS
-- ============================================================

CREATE TABLE IF NOT EXISTS `productos` (
  `id`                    int            NOT NULL AUTO_INCREMENT,
  `marca`                 varchar(100)   NOT NULL,
  `modelo`                varchar(200)   NOT NULL,
  `precio`                decimal(10,2)  NOT NULL,
  `categoria_id`          int            DEFAULT NULL,
  `stock`                 int            DEFAULT '0',
  `eficiencia_energetica` varchar(10)    DEFAULT NULL,
  `imagen_url`            varchar(500)   DEFAULT NULL,
  `fecha_creacion`        datetime       DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  ESPECIFICACIONES
-- ============================================================

CREATE TABLE IF NOT EXISTS `especificaciones` (
  `id`          int           NOT NULL AUTO_INCREMENT,
  `producto_id` int           NOT NULL,
  `nombre_dato` varchar(150)  NOT NULL,
  `valor_dato`  varchar(500)  NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_producto` (`producto_id`),
  CONSTRAINT `especificaciones_ibfk_1`
    FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  CARRITO
-- ============================================================

CREATE TABLE IF NOT EXISTS `carrito` (
  `id`               int            NOT NULL AUTO_INCREMENT,
  `usuario_id`       int            NOT NULL,
  `producto_id`      int            NOT NULL,
  `producto_nombre`  varchar(200)   NOT NULL,
  `producto_marca`   varchar(100)   NOT NULL,
  `producto_precio`  decimal(10,2)  NOT NULL,
  `producto_imagen`  varchar(500)   DEFAULT '',
  `cantidad`         int            DEFAULT '1',
  `fecha_agregado`   datetime       DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `carrito_ibfk_1`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  CONTACTOS  (formulario AvantService)
-- ============================================================

CREATE TABLE IF NOT EXISTS `contactos` (
  `id`             int           NOT NULL AUTO_INCREMENT,
  `nombre`         varchar(100)  NOT NULL,
  `apellido`       varchar(100)  NOT NULL DEFAULT '',
  `email`          varchar(150)  NOT NULL,
  `telefono`       varchar(30)   DEFAULT NULL,
  `producto`       varchar(200)  DEFAULT NULL,
  `problema`       varchar(100)  DEFAULT NULL,
  `mensaje`        text          DEFAULT NULL,
  `origen`         varchar(50)   DEFAULT 'AVANTSERVICE',
  `leido`          tinyint(1)    DEFAULT '0',
  `fecha_creacion` datetime      DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  BLOG_POSTS
-- ============================================================

CREATE TABLE IF NOT EXISTS `blog_posts` (
  `id`         int           NOT NULL AUTO_INCREMENT,
  `titulo`     varchar(300)  NOT NULL,
  `slug`       varchar(300)  NOT NULL,
  `categoria`  varchar(100)  DEFAULT 'General',
  `resumen`    text          DEFAULT NULL,
  `contenido`  longtext      NOT NULL,
  `emoji`      varchar(20)   DEFAULT '🛠️',
  `destacado`  tinyint(1)    DEFAULT '0',
  `publicado`  tinyint(1)    DEFAULT '0',
  `fecha`      date          DEFAULT (CURDATE()),
  `creado_en`  datetime      DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  ANALYTICS — av_sessions
-- ============================================================

CREATE TABLE IF NOT EXISTS `av_sessions` (
  `id`           varchar(36)   NOT NULL,
  `user_id`      varchar(36)   DEFAULT NULL,
  `ip`           varchar(45)   DEFAULT NULL,
  `device_type`  varchar(20)   DEFAULT 'desktop',
  `browser`      varchar(80)   DEFAULT NULL,
  `os`           varchar(80)   DEFAULT NULL,
  `screen_w`     smallint      DEFAULT '0',
  `screen_h`     smallint      DEFAULT '0',
  `country`      varchar(80)   DEFAULT NULL,
  `region`       varchar(80)   DEFAULT NULL,
  `city`         varchar(120)  DEFAULT NULL,
  `referrer`     varchar(500)  DEFAULT NULL,
  `landing_page` varchar(500)  DEFAULT NULL,
  `utm_source`   varchar(100)  DEFAULT NULL,
  `utm_medium`   varchar(100)  DEFAULT NULL,
  `utm_campaign` varchar(100)  DEFAULT NULL,
  `utm_content`  varchar(100)  DEFAULT NULL,
  `utm_term`     varchar(100)  DEFAULT NULL,
  `page_count`   int           DEFAULT '1',
  `created_at`   datetime      DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_created` (`created_at`),
  KEY `idx_user`    (`user_id`),
  KEY `idx_country` (`country`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  ANALYTICS — av_pageviews
-- ============================================================

CREATE TABLE IF NOT EXISTS `av_pageviews` (
  `id`           int           NOT NULL AUTO_INCREMENT,
  `session_id`   varchar(36)   NOT NULL,
  `user_id`      varchar(36)   DEFAULT NULL,
  `page`         varchar(500)  NOT NULL,
  `page_title`   varchar(300)  DEFAULT NULL,
  `referrer`     varchar(500)  DEFAULT NULL,
  `time_on_page` int           DEFAULT '0',
  `scroll_depth` tinyint       DEFAULT '0',
  `created_at`   datetime      DEFAULT CURRENT_TIMESTAMP,
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
  `id`          int           NOT NULL AUTO_INCREMENT,
  `session_id`  varchar(36)   NOT NULL,
  `user_id`     varchar(36)   DEFAULT NULL,
  `page`        varchar(500)  DEFAULT NULL,
  `event_type`  varchar(50)   NOT NULL,
  `event_label` varchar(200)  DEFAULT NULL,
  `event_value` varchar(200)  DEFAULT NULL,
  `created_at`  datetime      DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_session` (`session_id`),
  KEY `idx_type`    (`event_type`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  DATOS DE EJEMPLO (del SQL original)
-- ============================================================

INSERT IGNORE INTO `usuarios` (`id`, `nombre`, `email`, `password`, `fecha_registro`) VALUES
(1, 'newtest1', 'newtest1@gmail.com', '$2y$10$H1fXrfUD9mVugH9bev6/AeTc0tk1Z3CYv9tpQiahDdoWV57MKZMnm', '2026-04-14 12:39:25');

INSERT IGNORE INTO `productos` (`id`, `marca`, `modelo`, `precio`, `categoria_id`, `stock`, `eficiencia_energetica`, `imagen_url`, `fecha_creacion`) VALUES
(1, 'NewTest', 'NewTest', 343.98, 2, 4444, 'A+++', '', '2026-04-14 12:34:14');

INSERT IGNORE INTO `carrito` (`id`, `usuario_id`, `producto_id`, `producto_nombre`, `producto_marca`, `producto_precio`, `producto_imagen`, `cantidad`, `fecha_agregado`) VALUES
(3, 1, 1, 'NewTest', 'NewTest', 343.98, 'img/no-photo.jpg', 1, '2026-04-14 12:40:10');

COMMIT;

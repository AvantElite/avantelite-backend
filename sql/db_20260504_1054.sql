-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1:3306
-- Tiempo de generación: 04-05-2026 a las 08:54:19
-- Versión del servidor: 8.4.7
-- Versión de PHP: 8.3.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `backendavant`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `app_config`
--

DROP TABLE IF EXISTS `app_config`;
CREATE TABLE IF NOT EXISTS `app_config` (
  `clave` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` text COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`clave`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `averias_resueltas`
--

DROP TABLE IF EXISTS `averias_resueltas`;
CREATE TABLE IF NOT EXISTS `averias_resueltas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `chat_token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `es_averia` tinyint(1) NOT NULL DEFAULT '1',
  `marca` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_averia` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modelo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `funcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resumen` text COLLATE utf8mb4_unicode_ci,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `solucion` text COLLATE utf8mb4_unicode_ci,
  `precio_reparacion` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_token` (`chat_token`(191))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `av_events`
--

DROP TABLE IF EXISTS `av_events`;
CREATE TABLE IF NOT EXISTS `av_events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_id` varchar(36) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `page` varchar(500) DEFAULT NULL,
  `event_type` varchar(50) NOT NULL,
  `event_label` varchar(200) DEFAULT NULL,
  `event_value` varchar(200) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_session` (`session_id`),
  KEY `idx_type` (`event_type`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `av_pageviews`
--

DROP TABLE IF EXISTS `av_pageviews`;
CREATE TABLE IF NOT EXISTS `av_pageviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_id` varchar(36) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `page` varchar(500) NOT NULL,
  `page_title` varchar(300) DEFAULT NULL,
  `referrer` varchar(500) DEFAULT NULL,
  `time_on_page` int DEFAULT '0',
  `scroll_depth` tinyint DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_session` (`session_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_created` (`created_at`),
  KEY `idx_page` (`page`(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `av_sessions`
--

DROP TABLE IF EXISTS `av_sessions`;
CREATE TABLE IF NOT EXISTS `av_sessions` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `device_type` varchar(20) DEFAULT 'desktop',
  `browser` varchar(80) DEFAULT NULL,
  `os` varchar(80) DEFAULT NULL,
  `screen_w` smallint DEFAULT '0',
  `screen_h` smallint DEFAULT '0',
  `country` varchar(80) DEFAULT NULL,
  `region` varchar(80) DEFAULT NULL,
  `city` varchar(120) DEFAULT NULL,
  `referrer` varchar(500) DEFAULT NULL,
  `landing_page` varchar(500) DEFAULT NULL,
  `utm_source` varchar(100) DEFAULT NULL,
  `utm_medium` varchar(100) DEFAULT NULL,
  `utm_campaign` varchar(100) DEFAULT NULL,
  `utm_content` varchar(100) DEFAULT NULL,
  `utm_term` varchar(100) DEFAULT NULL,
  `page_count` int DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_created` (`created_at`),
  KEY `idx_user` (`user_id`),
  KEY `idx_country` (`country`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `blog_posts`
--

DROP TABLE IF EXISTS `blog_posts`;
CREATE TABLE IF NOT EXISTS `blog_posts` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `titulo` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoria` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'General',
  `resumen` text COLLATE utf8mb4_unicode_ci,
  `contenido` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `emoji` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 0xF09F9BA0EFB88F,
  `destacado` tinyint(1) DEFAULT '0',
  `publicado` tinyint(1) DEFAULT '1',
  `fecha` date DEFAULT (curdate()),
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP,
  `actualizado` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `blog_posts`
--

INSERT INTO `blog_posts` (`id`, `titulo`, `slug`, `categoria`, `resumen`, `contenido`, `emoji`, `destacado`, `publicado`, `fecha`, `creado_en`, `actualizado`) VALUES
(1, '5 señales de que tu lavadora necesita revisión urgente', 'senales-lavadora-revision-urgente', 'Electrodomésticos', 'Ruidos inusuales, fugas de agua o programas que no terminan son síntomas que no debes ignorar. Te explicamos qué significan y qué hacer.', '<p>Una lavadora que empieza a fallar suele avisarte antes de romperse del todo. Estos son los cinco síntomas más habituales:</p><ul><li><strong>Ruidos metálicos o golpes:</strong> pueden indicar que el tambor tiene una pieza suelta o que los amortiguadores están desgastados.</li><li><strong>Fugas de agua:</strong> revisa juntas y mangueras. Si la fuga viene del tambor, requiere técnico.</li><li><strong>Vibraciones excesivas:</strong> posible desequilibrio del tambor o patas desniveladas.</li><li><strong>Programas que no terminan:</strong> fallo en la electrónica o en la sonda de temperatura.</li><li><strong>Olor a quemado:</strong> llama a un técnico de inmediato, puede ser el motor.</li></ul>', '🧺', 1, 1, '2026-04-10', '2026-05-04 08:21:40', '2026-05-04 08:21:40'),
(2, '¿Por qué mi Smart TV va lento? Causas y soluciones', 'smart-tv-lento-causas-soluciones', 'Televisores', 'Con el tiempo los televisores inteligentes pueden volverse lentos. Descubre por qué ocurre y cómo recuperar el rendimiento sin necesidad de cambiar el aparato.', '<p>El rendimiento de un Smart TV se degrada con el uso. Las causas más frecuentes son:</p><ul><li><strong>Memoria RAM saturada:</strong> demasiadas apps instaladas. Desinstala las que no uses.</li><li><strong>Software desactualizado:</strong> actualiza el firmware desde los ajustes del televisor.</li><li><strong>Caché acumulada:</strong> limpia la caché de las aplicaciones periódicamente.</li><li><strong>Conexión WiFi débil:</strong> usa cable Ethernet si es posible para mejor estabilidad.</li></ul><p>Si tras estos pasos sigue lento, puede ser un problema de hardware que requiere revisión técnica.</p>', '📺', 0, 1, '2026-04-05', '2026-05-04 08:21:40', '2026-05-04 08:21:40'),
(3, 'Mantenimiento anual de calderas: qué incluye y por qué importa', 'mantenimiento-anual-calderas', 'Calderas', 'Una revisión anual puede evitar averías costosas en invierno y garantizar la seguridad de toda la familia.', '<p>La revisión anual de la caldera es obligatoria en muchas comunidades autónomas y, sobre todo, es esencial para tu seguridad. Esto es lo que comprueba un técnico:</p><ul><li>Estado del quemador y electrodo de encendido</li><li>Presión del circuito hidráulico</li><li>Funcionamiento del termostato y válvulas de seguridad</li><li>Niveles de emisiones de CO₂</li><li>Estado de la chimenea o salida de humos</li></ul><p>Una caldera bien mantenida consume hasta un 15% menos de gas.</p>', '🔥', 0, 1, '2026-03-28', '2026-05-04 08:21:40', '2026-05-04 08:21:40');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `carrito`
--

DROP TABLE IF EXISTS `carrito`;
CREATE TABLE IF NOT EXISTS `carrito` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `producto_id` int NOT NULL,
  `producto_nombre` varchar(200) NOT NULL,
  `producto_marca` varchar(100) NOT NULL,
  `producto_precio` decimal(10,2) NOT NULL,
  `producto_imagen` varchar(500) DEFAULT '',
  `cantidad` int DEFAULT '1',
  `fecha_agregado` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `carrito`
--

INSERT INTO `carrito` (`id`, `usuario_id`, `producto_id`, `producto_nombre`, `producto_marca`, `producto_precio`, `producto_imagen`, `cantidad`, `fecha_agregado`) VALUES
(3, 1, 1, 'NewTest', 'NewTest', 343.98, 'img/no-photo.jpg', 1, '2026-04-14 12:40:10');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `contactos`
--

DROP TABLE IF EXISTS `contactos`;
CREATE TABLE IF NOT EXISTS `contactos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL DEFAULT '',
  `email` varchar(150) NOT NULL,
  `telefono` varchar(30) DEFAULT NULL,
  `producto` varchar(200) DEFAULT NULL,
  `problema` varchar(100) DEFAULT NULL,
  `mensaje` text,
  `origen` varchar(50) DEFAULT 'AVANTSERVICE',
  `tipo` enum('formulario','diy') NOT NULL DEFAULT 'formulario',
  `dificultad` enum('facil','medio','dificil') DEFAULT NULL,
  `leido` tinyint(1) DEFAULT '0',
  `fecha_leido` datetime DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `especificaciones`
--

DROP TABLE IF EXISTS `especificaciones`;
CREATE TABLE IF NOT EXISTS `especificaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `producto_id` int NOT NULL,
  `nombre_dato` varchar(150) NOT NULL,
  `valor_dato` varchar(500) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_producto` (`producto_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `eventos`
--

DROP TABLE IF EXISTS `eventos`;
CREATE TABLE IF NOT EXISTS `eventos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha` datetime NOT NULL,
  `tipo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pagina` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `valor` varchar(250) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_fecha` (`fecha`),
  KEY `idx_nombre` (`nombre`),
  KEY `session_id` (`session_id`)
) ENGINE=InnoDB AUTO_INCREMENT=108 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `eventos`
--

INSERT INTO `eventos` (`id`, `session_id`, `fecha`, `tipo`, `nombre`, `pagina`, `valor`) VALUES
(1, '847a397a-f1c7-40fe-b3fa-e7712a3d83e1', '2026-04-15 10:10:28', 'scroll', 'Scroll 75% /', '/', ''),
(2, '1f9feb3e-9d6d-4f6d-9802-c4350f0a2c05', '2026-04-15 10:47:01', 'scroll', 'Scroll 75% /index.html', '/index.html', ''),
(3, '1f9feb3e-9d6d-4f6d-9802-c4350f0a2c05', '2026-04-15 10:47:17', 'scroll', 'Scroll 75% /productos.html', '/productos.html', ''),
(4, '1f9feb3e-9d6d-4f6d-9802-c4350f0a2c05', '2026-04-15 11:50:10', 'scroll', 'Scroll 75% /store.html', '/store.html#inicio', ''),
(5, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 11:50:22', 'scroll', 'Scroll 75% /productos.html', '/productos.html', ''),
(6, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:19:52', 'scroll', 'Scroll 75% /store.html', '/store.html#inicio', ''),
(7, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:22:35', 'scroll', 'Scroll 75% /productos.html', '/productos.html', ''),
(8, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:24:04', 'scroll', 'Scroll 75% /store.html', '/store.html#contacto', ''),
(9, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:24:12', 'scroll', 'Scroll 75% /productos.html', '/productos.html#comparacion', ''),
(10, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:24:16', 'scroll', 'Scroll 75% /store.html', '/store.html#contacto', ''),
(11, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:24:21', 'scroll', 'Scroll 75% /store.html', '/store.html#contacto', ''),
(12, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:25:23', 'scroll', 'Scroll 75% /productos.html', '/productos.html#comparacion', ''),
(13, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:54:33', 'scroll', 'Scroll 75% /store.html', '/store.html#contacto', ''),
(14, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:59:20', 'scroll', 'Scroll 75% /store.html', '/store.html#contacto', ''),
(15, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 13:03:28', 'scroll', 'Scroll 75% /store.html', '/store.html#inicio', ''),
(16, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 13:24:01', 'scroll', 'Scroll 75% /index.html', '/index.html', ''),
(17, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 13:24:38', 'scroll', 'Scroll 75% /index.html', '/index.html', ''),
(18, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 13:24:52', 'scroll', 'Scroll 75% /store.html', '/store.html', ''),
(19, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 13:27:55', 'scroll', 'Scroll 75% /store.html', '/store.html', ''),
(20, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 13:28:06', 'scroll', 'Scroll 75% /store.html', '/store.html', ''),
(21, 'e6292a4e-79ad-4356-8a6d-a490311852ac', '2026-04-15 13:32:39', 'scroll', 'Scroll 75% /store.html', '/store.html', ''),
(22, 'e6292a4e-79ad-4356-8a6d-a490311852ac', '2026-04-15 13:35:53', 'scroll', 'Scroll 75% /store.html', '/store.html', ''),
(23, 'e6292a4e-79ad-4356-8a6d-a490311852ac', '2026-04-15 13:39:28', 'scroll', 'Scroll 75% /store.html', '/store.html', ''),
(24, 'e6292a4e-79ad-4356-8a6d-a490311852ac', '2026-04-15 13:39:29', 'scroll', 'Scroll 75% /index.html', '/index.html', ''),
(25, 'e6292a4e-79ad-4356-8a6d-a490311852ac', '2026-04-15 13:40:30', 'scroll', 'Scroll 75% /store.html', '/store.html', ''),
(26, 'e6292a4e-79ad-4356-8a6d-a490311852ac', '2026-04-15 13:41:12', 'scroll', 'Scroll 75% /productos.html', '/productos.html', ''),
(27, 'e6292a4e-79ad-4356-8a6d-a490311852ac', '2026-04-15 13:41:20', 'scroll', 'Scroll 75% /store.html', '/store.html#inicio', ''),
(28, 'e6292a4e-79ad-4356-8a6d-a490311852ac', '2026-04-15 13:47:33', 'scroll', 'Scroll 75% /productos.html', '/productos.html', ''),
(29, 'e6292a4e-79ad-4356-8a6d-a490311852ac', '2026-04-15 13:47:38', 'scroll', 'Scroll 75% /store.html', '/store.html#contacto', ''),
(30, 'b94e6793-3319-4d13-96aa-aed8c709fe88', '2026-04-17 09:59:13', 'scroll', 'Scroll 75% /store.html', '/store.html', ''),
(31, 'e6292a4e-79ad-4356-8a6d-a490311852ac', '2026-04-17 10:04:46', 'scroll', 'Scroll 75% /store.html', '/store.html#inicio', ''),
(32, 'ec65e0ed-9f82-43b6-afb7-384bf1426f4b', '2026-04-17 10:22:20', 'scroll', 'Scroll 75% /index.html', '/index.html', ''),
(33, 'ec65e0ed-9f82-43b6-afb7-384bf1426f4b', '2026-04-17 10:29:07', 'scroll', 'Scroll 75% /store.html', '/store.html', ''),
(34, 'ec65e0ed-9f82-43b6-afb7-384bf1426f4b', '2026-04-17 10:29:21', 'scroll', 'Scroll 75% /store.html', '/store.html', ''),
(35, 'efd71e56-69fe-49c2-bc7f-4083ba4e0afa', '2026-04-17 11:14:46', 'scroll', 'Scroll 75% /store.html', '/store.html', ''),
(36, 'efd71e56-69fe-49c2-bc7f-4083ba4e0afa', '2026-04-17 11:41:00', 'scroll', 'Scroll 75% /store.html', '/store.html', ''),
(37, '738d1d52-4dad-4719-a9ae-bb03bc27e9f0', '2026-04-21 12:37:00', 'scroll', 'Scroll 75% /C:/Users/Lenovo/Desktop/HAM/Pagina%20web/index.html', '/C:/Users/Lenovo/Desktop/HAM/Pagina%20web/index.html', ''),
(38, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:12:38', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(39, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:12:40', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(40, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:12:42', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(41, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:12:45', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(42, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:12:48', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(43, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:12:52', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(44, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:12:54', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(45, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:13:09', 'scroll', 'Scroll 75% /live/productos.html', '/live/productos.html', ''),
(46, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:14:41', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(47, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:14:44', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(48, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:14:48', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(49, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:15:00', 'scroll', 'Scroll 75% /live/productos.html', '/live/productos.html', ''),
(50, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:15:12', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(51, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:16:28', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(52, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:16:57', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(53, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:17:01', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(54, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:17:03', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(55, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:17:10', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(56, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 11:00:33', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(57, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 11:00:42', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(58, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 11:00:55', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(59, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 11:01:17', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(60, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 11:01:27', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(61, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 11:10:15', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(62, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:20:03', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(63, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:39:09', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(64, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:45:30', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(65, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:50:59', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(66, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 13:03:35', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(67, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:05:05', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(68, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:05:08', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(69, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:05:10', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(70, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:05:24', 'scroll', 'Scroll 75% /live/productos.html', '/live/productos.html', ''),
(71, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:05:50', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(72, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:06:06', 'scroll', 'Scroll 75% /live/usuarios.html', '/live/usuarios.html', ''),
(73, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:06:40', 'scroll', 'Scroll 75% /live/store.html', '/live/store.html#inicio', ''),
(74, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:06:45', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(75, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:07:00', 'scroll', 'Scroll 75% /live/store.html', '/live/store.html', ''),
(76, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:27:30', 'scroll', 'Scroll 75% /live/store.html', '/live/store.html', ''),
(77, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:29:36', 'scroll', 'Scroll 75% /live/store.html', '/live/store.html#contacto', ''),
(78, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:36:35', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(79, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:38:20', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(80, '62127b47-5a75-4ecb-b038-b20c6bfb1cb9', '2026-04-23 13:43:11', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(81, '62127b47-5a75-4ecb-b038-b20c6bfb1cb9', '2026-04-23 13:43:36', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(82, '62127b47-5a75-4ecb-b038-b20c6bfb1cb9', '2026-04-23 13:43:38', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(83, '62127b47-5a75-4ecb-b038-b20c6bfb1cb9', '2026-04-23 13:43:42', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(84, '62127b47-5a75-4ecb-b038-b20c6bfb1cb9', '2026-04-23 13:44:33', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(85, '62127b47-5a75-4ecb-b038-b20c6bfb1cb9', '2026-04-23 13:44:36', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(86, '62127b47-5a75-4ecb-b038-b20c6bfb1cb9', '2026-04-23 13:44:38', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(87, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:41:27', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(88, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:41:31', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(89, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:41:35', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(90, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:48:59', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(91, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:51:42', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(92, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:51:44', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(93, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:52:09', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(94, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:52:20', 'scroll', 'Scroll 75% /live/store.html', '/live/store.html', ''),
(95, '6d3f9d1b-f9a1-4151-aead-c769260ec9c2', '2026-04-28 12:13:45', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(96, '6d3f9d1b-f9a1-4151-aead-c769260ec9c2', '2026-04-28 12:13:46', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(97, '6d3f9d1b-f9a1-4151-aead-c769260ec9c2', '2026-04-28 12:14:21', 'scroll', 'Scroll 75% /live/store.html', '/live/store.html', ''),
(98, '6d3f9d1b-f9a1-4151-aead-c769260ec9c2', '2026-04-28 12:35:41', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(99, '04956821-7dad-4f1f-82f2-269669493fb4', '2026-04-28 13:07:09', 'scroll', 'Scroll 75% /live/index.html', '/live/index.html', ''),
(100, 'b9a8b1ce-fb6f-4608-9be3-e45a6b50c75c', '2026-04-29 13:30:53', 'scroll', 'Scroll 75% /C:/Users/Lenovo/Desktop/HAM/AvantStoreOrganitation/index.html', '/C:/Users/Lenovo/Desktop/HAM/AvantStoreOrganitation/index.html', ''),
(101, 'b9a8b1ce-fb6f-4608-9be3-e45a6b50c75c', '2026-04-29 13:30:56', 'scroll', 'Scroll 75% /C:/Users/Lenovo/Desktop/HAM/AvantStoreOrganitation/index.html', '/C:/Users/Lenovo/Desktop/HAM/AvantStoreOrganitation/index.html', ''),
(102, 'b9a8b1ce-fb6f-4608-9be3-e45a6b50c75c', '2026-04-29 13:30:58', 'scroll', 'Scroll 75% /C:/Users/Lenovo/Desktop/HAM/AvantStoreOrganitation/index.html', '/C:/Users/Lenovo/Desktop/HAM/AvantStoreOrganitation/index.html', ''),
(103, '2a3d3057-fb64-4441-8039-69d83808268c', '2026-04-29 13:31:04', 'scroll', 'Scroll 75% /C:/Users/Lenovo/Desktop/HAM/AvantStoreOrganitation/index.html', '/C:/Users/Lenovo/Desktop/HAM/AvantStoreOrganitation/index.html', ''),
(104, '95bb9c2a-2dd6-47ff-bbd7-431b1cfd7eb1', '2026-04-30 10:34:31', 'scroll', 'Scroll 75% /C:/Users/Lenovo/Desktop/HAM/AvantStoreOrganitation/index.html', '/C:/Users/Lenovo/Desktop/HAM/AvantStoreOrganitation/index.html', ''),
(105, '95bb9c2a-2dd6-47ff-bbd7-431b1cfd7eb1', '2026-04-30 10:34:38', 'scroll', 'Scroll 75% /C:/Users/Lenovo/Desktop/HAM/AvantStoreOrganitation/index.html', '/C:/Users/Lenovo/Desktop/HAM/AvantStoreOrganitation/index.html', ''),
(106, '95bb9c2a-2dd6-47ff-bbd7-431b1cfd7eb1', '2026-04-30 10:35:14', 'scroll', 'Scroll 75% /C:/Users/Lenovo/Desktop/HAM/AvantStoreOrganitation/index.html', '/C:/Users/Lenovo/Desktop/HAM/AvantStoreOrganitation/index.html', ''),
(107, '95bb9c2a-2dd6-47ff-bbd7-431b1cfd7eb1', '2026-04-30 10:35:44', 'scroll', 'Scroll 75% /C:/Users/Lenovo/Desktop/HAM/AvantStoreOrganitation/store.html', '/C:/Users/Lenovo/Desktop/HAM/AvantStoreOrganitation/store.html', '');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `portal_sesiones`
--

DROP TABLE IF EXISTS `portal_sesiones`;
CREATE TABLE IF NOT EXISTS `portal_sesiones` (
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `presupuesto_token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`token`),
  KEY `idx_expires` (`expires_at`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `presupuestos`
--

DROP TABLE IF EXISTS `presupuestos`;
CREATE TABLE IF NOT EXISTS `presupuestos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `contacto_id` int NOT NULL,
  `token` varchar(64) NOT NULL,
  `lineas` json NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `mensaje` text,
  `notas` text,
  `estado` enum('pendiente','aceptado','rechazado') NOT NULL DEFAULT 'pendiente',
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_respuesta` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `contacto_id` (`contacto_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

DROP TABLE IF EXISTS `productos`;
CREATE TABLE IF NOT EXISTS `productos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `marca` varchar(100) NOT NULL,
  `modelo` varchar(200) NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `categoria_id` int DEFAULT NULL,
  `stock` int DEFAULT '0',
  `eficiencia_energetica` varchar(10) DEFAULT NULL,
  `imagen_url` varchar(500) DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id`, `marca`, `modelo`, `precio`, `categoria_id`, `stock`, `eficiencia_energetica`, `imagen_url`, `fecha_creacion`) VALUES
(1, 'NewTest', 'NewTest', 343.98, 2, 4444, 'A+++', '', '2026-04-14 12:34:14');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `rag_knowledge`
--

DROP TABLE IF EXISTS `rag_knowledge`;
CREATE TABLE IF NOT EXISTS `rag_knowledge` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `contenido` text NOT NULL,
  `categoria` varchar(100) NOT NULL DEFAULT 'General',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `tiene_vector` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sesiones`
--

DROP TABLE IF EXISTS `sesiones`;
CREATE TABLE IF NOT EXISTS `sesiones` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `inicio` datetime NOT NULL,
  `fin` datetime DEFAULT NULL,
  `duracion_seg` int DEFAULT '0',
  `paginas_vistas` int DEFAULT '1',
  `rebote` tinyint(1) DEFAULT '1',
  `dispositivo` enum('mobile','desktop','tablet') COLLATE utf8mb4_unicode_ci DEFAULT 'desktop',
  `pais` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT 'Desconocido',
  `ciudad` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fuente` enum('organic','direct','social','paid','referral') COLLATE utf8mb4_unicode_ci DEFAULT 'direct',
  `utm_source` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `utm_medium` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `utm_campaign` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referrer` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_inicio` (`inicio`),
  KEY `idx_fuente` (`fuente`),
  KEY `idx_dispositivo` (`dispositivo`),
  KEY `idx_pais` (`pais`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `sesiones`
--

INSERT INTO `sesiones` (`id`, `inicio`, `fin`, `duracion_seg`, `paginas_vistas`, `rebote`, `dispositivo`, `pais`, `ciudad`, `fuente`, `utm_source`, `utm_medium`, `utm_campaign`, `referrer`, `user_agent`, `ip`) VALUES
('04956821-7dad-4f1f-82f2-269669493fb4', '2026-04-28 13:06:29', NULL, 0, 4, 0, 'desktop', 'España', NULL, 'referral', NULL, NULL, NULL, 'http://127.0.0.1:8000/', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '::1'),
('183f7ba7-4f6d-415d-94ca-34a65b93b48a', '2026-04-30 12:31:06', NULL, 0, 1, 0, 'desktop', 'España', NULL, 'referral', NULL, NULL, NULL, 'http://127.0.0.1:8000/', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '::1'),
('1ce07df1-26e1-4238-8d06-df99ee97aa44', '2026-04-28 12:06:10', NULL, 0, 1, 0, 'desktop', 'España', NULL, 'direct', NULL, NULL, NULL, '', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '::1'),
('1f9feb3e-9d6d-4f6d-9802-c4350f0a2c05', '2026-04-15 10:47:00', NULL, 0, 4, 0, 'desktop', 'España', NULL, 'direct', NULL, NULL, NULL, '', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '::1'),
('2a3d3057-fb64-4441-8039-69d83808268c', '2026-04-29 13:31:04', NULL, 0, 2, 0, 'desktop', 'España', NULL, 'direct', NULL, NULL, NULL, '', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '::1'),
('2b5ad69f-b72f-4773-bfe8-abf4be706b26', '2026-04-23 13:42:42', NULL, 0, 1, 0, 'desktop', 'España', NULL, 'referral', NULL, NULL, NULL, 'http://127.0.0.1:8000/', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '::1'),
('44e6aa04-d04e-42f3-aea7-bb4734dd7a7e', '2026-04-28 11:29:00', NULL, 0, 1, 0, 'desktop', 'España', NULL, 'referral', NULL, NULL, NULL, 'http://127.0.0.1:8000/', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '::1'),
('62127b47-5a75-4ecb-b038-b20c6bfb1cb9', '2026-04-23 13:43:10', NULL, 0, 18, 0, 'desktop', 'España', NULL, 'direct', NULL, NULL, NULL, '', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '::1'),
('630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:41:25', NULL, 0, 28, 0, 'desktop', 'España', NULL, 'referral', NULL, NULL, NULL, 'http://127.0.0.1:8000/', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '::1'),
('6d3f9d1b-f9a1-4151-aead-c769260ec9c2', '2026-04-28 12:10:33', NULL, 0, 11, 0, 'desktop', 'España', NULL, 'direct', NULL, NULL, NULL, '', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '::1'),
('725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:05:05', NULL, 0, 29, 0, 'desktop', 'España', NULL, 'direct', NULL, NULL, NULL, '', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '::1'),
('738d1d52-4dad-4719-a9ae-bb03bc27e9f0', '2026-04-21 12:36:59', NULL, 0, 2, 0, 'desktop', 'España', NULL, 'direct', NULL, NULL, NULL, '', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '::1'),
('77e6c2a8-622c-4519-8d8c-993de314bfc8', '2026-04-29 13:03:59', NULL, 0, 1, 0, 'desktop', 'España', NULL, 'referral', NULL, NULL, NULL, 'http://127.0.0.1:8000/', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '::1'),
('847a397a-f1c7-40fe-b3fa-e7712a3d83e1', '2026-04-15 10:10:27', NULL, 0, 3, 0, 'desktop', 'España', NULL, 'direct', NULL, NULL, NULL, '', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '::1'),
('88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 10:22:43', NULL, 0, 38, 0, 'desktop', 'España', NULL, 'referral', NULL, NULL, NULL, 'http://127.0.0.1:8000/', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '::1'),
('9574f468-9473-4f4a-86fa-a96c14939011', '2026-04-16 10:27:17', NULL, 0, 11, 0, 'desktop', 'España', NULL, 'direct', NULL, NULL, NULL, '', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '::1'),
('95bb9c2a-2dd6-47ff-bbd7-431b1cfd7eb1', '2026-04-30 10:34:31', NULL, 0, 6, 0, 'desktop', 'España', NULL, 'direct', NULL, NULL, NULL, '', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '::1'),
('a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 11:50:21', NULL, 0, 62, 0, 'desktop', 'España', NULL, 'referral', NULL, NULL, NULL, 'http://127.0.0.1:5500/store.html', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '::1'),
('ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:12:35', NULL, 0, 69, 0, 'desktop', 'España', NULL, 'direct', NULL, NULL, NULL, '', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '::1'),
('aee1ac33-7073-4c72-ab23-a2bd4f59668b', '2026-04-30 12:51:31', NULL, 0, 1, 0, 'desktop', 'España', NULL, 'direct', NULL, NULL, NULL, '', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '::1'),
('b6b11d9b-5a73-4309-b5b2-8eff25929fc5', '2026-04-28 12:04:40', NULL, 0, 1, 0, 'desktop', 'España', NULL, 'direct', NULL, NULL, NULL, '', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '::1'),
('b94e6793-3319-4d13-96aa-aed8c709fe88', '2026-04-17 09:58:58', NULL, 0, 1, 0, 'desktop', 'España', NULL, 'referral', NULL, NULL, NULL, 'http://127.0.0.1:5500/', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '::1'),
('b9a8b1ce-fb6f-4608-9be3-e45a6b50c75c', '2026-04-29 13:30:52', NULL, 0, 4, 0, 'desktop', 'España', NULL, 'direct', NULL, NULL, NULL, '', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '::1'),
('c5649a63-62c4-44cb-a6d5-3963517ee733', '2026-04-30 10:03:54', NULL, 0, 1, 0, 'desktop', 'España', NULL, 'direct', NULL, NULL, NULL, '', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '::1'),
('ce523c9e-419c-4c07-97bf-fad45497e36c', '2026-04-29 13:53:57', NULL, 0, 2, 0, 'desktop', 'España', NULL, 'direct', NULL, NULL, NULL, '', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '::1'),
('e6292a4e-79ad-4356-8a6d-a490311852ac', '2026-04-15 13:32:06', NULL, 0, 24, 0, 'desktop', 'España', NULL, 'direct', NULL, NULL, NULL, '', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '::1'),
('ec65e0ed-9f82-43b6-afb7-384bf1426f4b', '2026-04-17 10:22:19', NULL, 0, 7, 0, 'desktop', 'España', NULL, 'direct', NULL, NULL, NULL, '', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '::1'),
('ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:36:34', NULL, 0, 56, 0, 'desktop', 'España', NULL, 'referral', NULL, NULL, NULL, 'http://127.0.0.1:8000/', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '::1'),
('ef5d664a-b86c-4df7-9bca-3cbb2f4b3a66', '2026-04-23 11:55:08', NULL, 0, 4, 0, 'desktop', 'España', NULL, 'referral', NULL, NULL, NULL, 'http://127.0.0.1:8000/live/index.html?t=1776935105078', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '::1'),
('efd71e56-69fe-49c2-bc7f-4083ba4e0afa', '2026-04-17 11:14:24', NULL, 0, 3, 0, 'desktop', 'España', NULL, 'direct', NULL, NULL, NULL, '', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '::1'),
('ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:20:00', NULL, 0, 84, 0, 'desktop', 'España', NULL, 'direct', NULL, NULL, NULL, '', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '::1');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `store_carrito`
--

DROP TABLE IF EXISTS `store_carrito`;
CREATE TABLE IF NOT EXISTS `store_carrito` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `producto_id` int NOT NULL,
  `producto_nombre` varchar(200) NOT NULL,
  `producto_marca` varchar(100) NOT NULL,
  `producto_precio` decimal(10,2) NOT NULL,
  `producto_imagen` varchar(500) DEFAULT '',
  `cantidad` int DEFAULT '1',
  `fecha_agregado` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_usuario` (`usuario_id`),
  KEY `fk_store_carrito_producto` (`producto_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `store_categorias`
--

DROP TABLE IF EXISTS `store_categorias`;
CREATE TABLE IF NOT EXISTS `store_categorias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `slug` varchar(180) DEFAULT NULL,
  `descripcion` varchar(500) DEFAULT NULL,
  `parent_id` int DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`),
  KEY `idx_parent` (`parent_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `store_categorias`
--

INSERT INTO `store_categorias` (`id`, `nombre`, `slug`, `descripcion`, `parent_id`, `fecha_creacion`) VALUES
(1, 'Calentadores de Agua', 'calentadores-de-agua', NULL, NULL, '2026-05-04 10:26:54'),
(2, 'Aire Acondicionado', 'aire-acondicionado', NULL, NULL, '2026-05-04 10:26:54'),
(3, 'Lavadoras', 'lavadoras', NULL, NULL, '2026-05-04 10:26:54'),
(4, 'Extractores de Humo', 'extractores-de-humo', NULL, NULL, '2026-05-04 10:26:54');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `store_especificaciones`
--

DROP TABLE IF EXISTS `store_especificaciones`;
CREATE TABLE IF NOT EXISTS `store_especificaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `producto_id` int NOT NULL,
  `nombre_dato` varchar(150) NOT NULL,
  `valor_dato` varchar(500) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_producto` (`producto_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `store_eventos`
--

DROP TABLE IF EXISTS `store_eventos`;
CREATE TABLE IF NOT EXISTS `store_eventos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha` datetime NOT NULL,
  `tipo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pagina` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `valor` varchar(250) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_fecha` (`fecha`),
  KEY `idx_nombre` (`nombre`),
  KEY `session_id` (`session_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `store_eventos`
--

INSERT INTO `store_eventos` (`id`, `session_id`, `fecha`, `tipo`, `nombre`, `pagina`, `valor`) VALUES
(1, 'abc123', '2026-04-30 11:39:42', 'click', 'add_to_cart', '', '1'),
(2, '60aeae27-08bf-4571-8ac9-2aadc5576fa2', '2026-05-04 10:24:04', 'scroll', 'Scroll 75% /productos.html', '/productos.html', '');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `store_productos`
--

DROP TABLE IF EXISTS `store_productos`;
CREATE TABLE IF NOT EXISTS `store_productos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `marca` varchar(100) NOT NULL,
  `modelo` varchar(200) NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `categoria_id` int DEFAULT NULL,
  `stock` int DEFAULT '0',
  `eficiencia_energetica` varchar(10) DEFAULT NULL,
  `imagen_url` varchar(500) DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_store_productos_categoria` (`categoria_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `store_productos`
--

INSERT INTO `store_productos` (`id`, `marca`, `modelo`, `precio`, `categoria_id`, `stock`, `eficiencia_energetica`, `imagen_url`, `fecha_creacion`) VALUES
(7, 'SAMSUNG', 'X3', 300.00, 2, 10, 'A+++', NULL, '2026-05-04 10:30:14');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `store_sesiones`
--

DROP TABLE IF EXISTS `store_sesiones`;
CREATE TABLE IF NOT EXISTS `store_sesiones` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `inicio` datetime NOT NULL,
  `fin` datetime DEFAULT NULL,
  `duracion_seg` int DEFAULT '0',
  `paginas_vistas` int DEFAULT '1',
  `rebote` tinyint(1) DEFAULT '1',
  `dispositivo` enum('mobile','desktop','tablet') COLLATE utf8mb4_unicode_ci DEFAULT 'desktop',
  `pais` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT 'Desconocido',
  `ciudad` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fuente` enum('organic','direct','social','paid','referral') COLLATE utf8mb4_unicode_ci DEFAULT 'direct',
  `utm_source` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `utm_medium` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `utm_campaign` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referrer` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_inicio` (`inicio`),
  KEY `idx_fuente` (`fuente`),
  KEY `idx_dispositivo` (`dispositivo`),
  KEY `idx_pais` (`pais`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `store_sesiones`
--

INSERT INTO `store_sesiones` (`id`, `inicio`, `fin`, `duracion_seg`, `paginas_vistas`, `rebote`, `dispositivo`, `pais`, `ciudad`, `fuente`, `utm_source`, `utm_medium`, `utm_campaign`, `referrer`, `user_agent`, `ip`) VALUES
('60aeae27-08bf-4571-8ac9-2aadc5576fa2', '2026-05-04 10:23:46', '2026-05-04 10:24:49', 47, 3, 0, 'desktop', 'España', NULL, 'direct', NULL, NULL, NULL, '', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '::1'),
('abc123', '2026-04-30 11:39:42', NULL, 0, 1, 0, 'desktop', 'España', NULL, 'organic', NULL, NULL, NULL, 'https://google.com', 'curl/8.18.0', '::1'),
('e08d64aa-e71b-4cfe-b604-d5febd3a6102', '2026-05-04 10:30:49', '2026-05-04 10:33:53', 131, 2, 0, 'desktop', 'España', NULL, 'direct', NULL, NULL, NULL, '', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '::1');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `store_usuarios`
--

DROP TABLE IF EXISTS `store_usuarios`;
CREATE TABLE IF NOT EXISTS `store_usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `fecha_registro` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `store_usuarios`
--

INSERT INTO `store_usuarios` (`id`, `nombre`, `email`, `password`, `fecha_registro`) VALUES
(1, 'Test', 'test@x.com', '$2b$10$tfyyYQZ3VNxfa.te/TCCf.cJdgop7aDSu/Vg8iBCgvo9fZ6dBsKFy', '2026-04-30 11:39:30');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `store_visitas`
--

DROP TABLE IF EXISTS `store_visitas`;
CREATE TABLE IF NOT EXISTS `store_visitas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha` datetime NOT NULL,
  `pagina` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `titulo` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tiempo_seg` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_session` (`session_id`),
  KEY `idx_fecha` (`fecha`),
  KEY `idx_pagina` (`pagina`(100))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `store_visitas`
--

INSERT INTO `store_visitas` (`id`, `session_id`, `fecha`, `pagina`, `titulo`, `tiempo_seg`) VALUES
(1, 'abc123', '2026-04-30 11:39:42', '/store', 'Tienda', 0),
(2, '60aeae27-08bf-4571-8ac9-2aadc5576fa2', '2026-05-04 10:23:46', '/productos.html', 'AvantStore | Productos', 0),
(3, '60aeae27-08bf-4571-8ac9-2aadc5576fa2', '2026-05-04 10:23:59', '/index.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(4, '60aeae27-08bf-4571-8ac9-2aadc5576fa2', '2026-05-04 10:24:01', '/productos.html', 'AvantStore | Productos', 0),
(5, 'e08d64aa-e71b-4cfe-b604-d5febd3a6102', '2026-05-04 10:30:49', '/INDEX.HTML', 'AvantStore | Socios Samsung Oficiales', 0),
(6, 'e08d64aa-e71b-4cfe-b604-d5febd3a6102', '2026-05-04 10:31:42', '/productos.html', 'AvantStore | Productos', 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `fecha_registro` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password`, `fecha_registro`) VALUES
(1, 'newtest1', 'newtest1@gmail.com', '$2y$10$H1fXrfUD9mVugH9bev6/AeTc0tk1Z3CYv9tpQiahDdoWV57MKZMnm', '2026-04-14 12:39:25');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `visitas`
--

DROP TABLE IF EXISTS `visitas`;
CREATE TABLE IF NOT EXISTS `visitas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha` datetime NOT NULL,
  `pagina` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `titulo` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tiempo_seg` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_session` (`session_id`),
  KEY `idx_fecha` (`fecha`),
  KEY `idx_pagina` (`pagina`(100))
) ENGINE=InnoDB AUTO_INCREMENT=481 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `visitas`
--

INSERT INTO `visitas` (`id`, `session_id`, `fecha`, `pagina`, `titulo`, `tiempo_seg`) VALUES
(1, '847a397a-f1c7-40fe-b3fa-e7712a3d83e1', '2026-04-15 10:10:27', '/', 'Proyecto Avant', 0),
(2, '847a397a-f1c7-40fe-b3fa-e7712a3d83e1', '2026-04-15 10:10:29', '/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(3, '847a397a-f1c7-40fe-b3fa-e7712a3d83e1', '2026-04-15 10:10:32', '/productos.html', 'AvantStore | Productos', 0),
(4, '1f9feb3e-9d6d-4f6d-9802-c4350f0a2c05', '2026-04-15 10:47:00', '/index.html', 'Proyecto Avant', 0),
(5, '1f9feb3e-9d6d-4f6d-9802-c4350f0a2c05', '2026-04-15 10:47:02', '/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(6, '1f9feb3e-9d6d-4f6d-9802-c4350f0a2c05', '2026-04-15 10:47:16', '/productos.html', 'AvantStore | Productos', 0),
(7, '1f9feb3e-9d6d-4f6d-9802-c4350f0a2c05', '2026-04-15 10:47:22', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(8, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 11:50:21', '/productos.html', 'AvantStore | Productos', 0),
(9, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 11:50:27', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(10, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:10:04', '/productos.html', 'AvantStore | Productos', 0),
(11, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:10:08', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(12, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:11:17', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(13, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:11:17', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(14, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:11:18', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(15, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:11:18', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(16, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:11:18', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(17, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:11:18', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(18, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:11:19', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(19, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:11:19', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(20, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:11:19', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(21, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:11:19', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(22, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:11:20', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(23, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:11:20', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(24, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:11:20', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(25, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:11:21', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(26, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:11:21', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(27, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:11:21', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(28, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:11:21', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(29, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:11:21', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(30, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:11:22', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(31, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:11:22', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(32, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:11:22', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(33, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:14:00', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(34, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:14:21', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(35, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:18:33', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(36, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:20:33', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(37, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:21:49', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(38, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:21:50', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(39, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:22:01', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(40, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:22:02', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(41, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:22:03', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(42, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:22:25', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(43, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:22:34', '/productos.html', 'AvantStore | Productos', 0),
(44, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:22:40', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(45, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:23:54', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(46, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:24:00', '/productos.html', 'AvantStore | Productos', 0),
(47, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:24:02', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(48, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:24:10', '/productos.html', 'AvantStore | Productos', 0),
(49, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:24:15', '/store.html#contacto', 'AvantStore | Socios Samsung Oficiales', 0),
(50, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:24:20', '/store.html#contacto', 'AvantStore | Socios Samsung Oficiales', 0),
(51, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:25:21', '/productos.html', 'AvantStore | Productos', 0),
(52, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:25:29', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(53, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:54:28', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(54, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 12:58:13', '/store.html#contacto', 'AvantStore | Socios Samsung Oficiales', 0),
(55, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 13:00:07', '/productos.html', 'AvantStore | Productos', 0),
(56, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 13:00:09', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(57, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 13:22:05', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(58, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 13:23:39', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(59, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 13:23:41', '/productos.html', 'AvantStore | Productos', 0),
(60, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 13:23:42', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(61, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 13:23:57', '/index.html', 'Proyecto Avant | Tecnología y Servicios de Vanguardia', 0),
(62, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 13:24:33', '/index.html', 'Proyecto Avant', 0),
(63, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 13:24:39', '/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(64, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 13:25:53', '/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(65, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 13:25:56', '/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(66, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 13:26:01', '/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(67, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 13:26:44', '/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(68, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 13:27:21', '/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(69, 'a5ef47fc-6b2e-4590-93ab-b3c72f072d87', '2026-04-15 13:28:01', '/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(70, 'e6292a4e-79ad-4356-8a6d-a490311852ac', '2026-04-15 13:32:06', '/index.html', 'Proyecto Avant', 0),
(71, 'e6292a4e-79ad-4356-8a6d-a490311852ac', '2026-04-15 13:32:08', '/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(72, 'e6292a4e-79ad-4356-8a6d-a490311852ac', '2026-04-15 13:34:47', '/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(73, 'e6292a4e-79ad-4356-8a6d-a490311852ac', '2026-04-15 13:35:02', '/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(74, 'e6292a4e-79ad-4356-8a6d-a490311852ac', '2026-04-15 13:35:49', '/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(75, 'e6292a4e-79ad-4356-8a6d-a490311852ac', '2026-04-15 13:39:07', '/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(76, 'e6292a4e-79ad-4356-8a6d-a490311852ac', '2026-04-15 13:39:07', '/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(77, 'e6292a4e-79ad-4356-8a6d-a490311852ac', '2026-04-15 13:39:18', '/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(78, 'e6292a4e-79ad-4356-8a6d-a490311852ac', '2026-04-15 13:39:27', '/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(79, 'e6292a4e-79ad-4356-8a6d-a490311852ac', '2026-04-15 13:39:28', '/index.html', 'Proyecto Avant', 0),
(80, 'e6292a4e-79ad-4356-8a6d-a490311852ac', '2026-04-15 13:39:30', '/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(81, 'e6292a4e-79ad-4356-8a6d-a490311852ac', '2026-04-15 13:39:36', '/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(82, 'e6292a4e-79ad-4356-8a6d-a490311852ac', '2026-04-15 13:40:06', '/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(83, 'e6292a4e-79ad-4356-8a6d-a490311852ac', '2026-04-15 13:41:11', '/productos.html', 'AvantStore | Productos', 0),
(84, 'e6292a4e-79ad-4356-8a6d-a490311852ac', '2026-04-15 13:41:14', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(85, 'e6292a4e-79ad-4356-8a6d-a490311852ac', '2026-04-15 13:47:23', '/productos.html', 'AvantStore | Productos', 0),
(86, 'e6292a4e-79ad-4356-8a6d-a490311852ac', '2026-04-15 13:47:25', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(87, 'e6292a4e-79ad-4356-8a6d-a490311852ac', '2026-04-15 13:47:31', '/productos.html', 'AvantStore | Productos', 0),
(88, 'e6292a4e-79ad-4356-8a6d-a490311852ac', '2026-04-15 13:47:37', '/store.html#contacto', 'AvantStore | Socios Samsung Oficiales', 0),
(89, 'e6292a4e-79ad-4356-8a6d-a490311852ac', '2026-04-15 13:47:45', '/productos.html', 'AvantStore | Productos', 0),
(90, 'e6292a4e-79ad-4356-8a6d-a490311852ac', '2026-04-15 13:47:45', '/productos.html', 'AvantStore | Productos', 0),
(91, 'e6292a4e-79ad-4356-8a6d-a490311852ac', '2026-04-15 13:47:47', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(92, 'e6292a4e-79ad-4356-8a6d-a490311852ac', '2026-04-15 13:47:57', '/productos.html', 'AvantStore | Productos', 0),
(93, 'e6292a4e-79ad-4356-8a6d-a490311852ac', '2026-04-15 13:48:08', '/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(94, '9574f468-9473-4f4a-86fa-a96c14939011', '2026-04-16 10:27:17', '/', 'Proyecto Avant', 0),
(95, '9574f468-9473-4f4a-86fa-a96c14939011', '2026-04-16 10:31:52', '/', 'Proyecto Avant', 0),
(96, '9574f468-9473-4f4a-86fa-a96c14939011', '2026-04-16 10:31:59', '/', 'Proyecto Avant', 0),
(97, '9574f468-9473-4f4a-86fa-a96c14939011', '2026-04-16 10:32:10', '/', 'Proyecto Avant', 0),
(98, '9574f468-9473-4f4a-86fa-a96c14939011', '2026-04-16 10:32:20', '/', 'Proyecto Avant', 0),
(99, '9574f468-9473-4f4a-86fa-a96c14939011', '2026-04-16 10:32:32', '/', 'Proyecto Avant', 0),
(100, '9574f468-9473-4f4a-86fa-a96c14939011', '2026-04-16 10:32:43', '/', 'Proyecto Avant', 0),
(101, '9574f468-9473-4f4a-86fa-a96c14939011', '2026-04-16 10:32:49', '/', 'Proyecto Avant', 0),
(102, '9574f468-9473-4f4a-86fa-a96c14939011', '2026-04-16 10:32:56', '/', 'Proyecto Avant', 0),
(103, '9574f468-9473-4f4a-86fa-a96c14939011', '2026-04-16 10:33:44', '/', 'Proyecto Avant', 0),
(104, '9574f468-9473-4f4a-86fa-a96c14939011', '2026-04-16 10:33:49', '/', 'Proyecto Avant', 0),
(105, 'b94e6793-3319-4d13-96aa-aed8c709fe88', '2026-04-17 09:58:58', '/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(106, 'ec65e0ed-9f82-43b6-afb7-384bf1426f4b', '2026-04-17 10:22:19', '/index.html', 'Proyecto Avant', 0),
(107, 'ec65e0ed-9f82-43b6-afb7-384bf1426f4b', '2026-04-17 10:22:21', '/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(108, 'ec65e0ed-9f82-43b6-afb7-384bf1426f4b', '2026-04-17 10:27:32', '/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(109, 'ec65e0ed-9f82-43b6-afb7-384bf1426f4b', '2026-04-17 10:28:37', '/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(110, 'ec65e0ed-9f82-43b6-afb7-384bf1426f4b', '2026-04-17 10:28:44', '/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(111, 'ec65e0ed-9f82-43b6-afb7-384bf1426f4b', '2026-04-17 10:28:53', '/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(112, 'ec65e0ed-9f82-43b6-afb7-384bf1426f4b', '2026-04-17 10:29:21', '/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(113, 'efd71e56-69fe-49c2-bc7f-4083ba4e0afa', '2026-04-17 11:14:24', '/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(114, 'efd71e56-69fe-49c2-bc7f-4083ba4e0afa', '2026-04-17 11:35:50', '/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(115, 'efd71e56-69fe-49c2-bc7f-4083ba4e0afa', '2026-04-17 11:39:52', '/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(116, '738d1d52-4dad-4719-a9ae-bb03bc27e9f0', '2026-04-21 12:36:59', '/C:/Users/Lenovo/Desktop/HAM/Pagina%20web/index.html', 'Proyecto Avant', 0),
(117, '738d1d52-4dad-4719-a9ae-bb03bc27e9f0', '2026-04-21 12:37:01', '/C:/Users/Lenovo/Desktop/HAM/Pagina%20web/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(118, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:12:35', '/live/index.html', 'Proyecto Avant', 0),
(119, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:12:38', '/live/index.html', 'Proyecto Avant', 0),
(120, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:12:41', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(121, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:12:41', '/live/index.html', 'Proyecto Avant', 0),
(122, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:12:43', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(123, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:12:44', '/live/index.html', 'Proyecto Avant', 0),
(124, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:12:45', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(125, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:12:47', '/live/index.html', 'Proyecto Avant', 0),
(126, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:12:48', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(127, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:12:50', '/live/index.html', 'Proyecto Avant', 0),
(128, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:12:53', '/live/index.html', 'Proyecto Avant', 0),
(129, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:12:54', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(130, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:12:56', '/live/index.html', 'Proyecto Avant', 0),
(131, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:12:58', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(132, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:12:59', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(133, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:13:02', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(134, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:13:05', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(135, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:13:07', '/live/productos.html', 'AvantStore | Productos', 0),
(136, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:13:08', '/live/productos.html', 'AvantStore | Productos', 0),
(137, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:13:11', '/live/productos.html', 'AvantStore | Productos', 0),
(138, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:13:14', '/live/productos.html', 'AvantStore | Productos', 0),
(139, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:13:16', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(140, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:14:41', '/live/index.html', 'Proyecto Avant', 0),
(141, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:14:43', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(142, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:14:44', '/live/index.html', 'Proyecto Avant', 0),
(143, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:14:45', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(144, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:14:47', '/live/index.html', 'Proyecto Avant', 0),
(145, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:14:47', '/live/index.html', 'Proyecto Avant', 0),
(146, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:14:48', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(147, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:14:58', '/live/productos.html', 'AvantStore | Productos', 0),
(148, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:15:01', '/live/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(149, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:15:12', '/live/index.html', 'Proyecto Avant', 0),
(150, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:15:13', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(151, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:15:17', '/live/productos.html', 'AvantStore | Productos', 0),
(152, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:15:20', '/live/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(153, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:16:27', '/live/index.html', 'Proyecto Avant', 0),
(154, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:16:29', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(155, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:16:34', '/live/productos.html', 'AvantStore | Productos', 0),
(156, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:16:36', '/live/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(157, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:16:54', '/live/index.html', 'Proyecto Avant', 0),
(158, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:16:57', '/live/index.html', 'Proyecto Avant', 0),
(159, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:17:00', '/live/index.html', 'Proyecto Avant', 0),
(160, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:17:01', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(161, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:17:03', '/live/index.html', 'Proyecto Avant', 0),
(162, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:17:10', '/live/index.html', 'Proyecto Avant', 0),
(163, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:17:13', '/live/index.html', 'Proyecto Avant', 0),
(164, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:17:16', '/live/index.html', 'Proyecto Avant', 0),
(165, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:17:19', '/live/index.html', 'Proyecto Avant', 0),
(166, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:17:22', '/live/index.html', 'Proyecto Avant', 0),
(167, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:17:25', '/live/index.html', 'Proyecto Avant', 0),
(168, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:17:28', '/live/index.html', 'Proyecto Avant', 0),
(169, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:17:31', '/live/index.html', 'Proyecto Avant', 0),
(170, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:17:34', '/live/index.html', 'Proyecto Avant', 0),
(171, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:17:37', '/live/index.html', 'Proyecto Avant', 0),
(172, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:17:40', '/live/index.html', 'Proyecto Avant', 0),
(173, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:17:43', '/live/index.html', 'Proyecto Avant', 0),
(174, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:17:46', '/live/index.html', 'Proyecto Avant', 0),
(175, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:17:49', '/live/index.html', 'Proyecto Avant', 0),
(176, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:17:52', '/live/index.html', 'Proyecto Avant', 0),
(177, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:17:55', '/live/index.html', 'Proyecto Avant', 0),
(178, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:17:58', '/live/index.html', 'Proyecto Avant', 0),
(179, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:18:01', '/live/index.html', 'Proyecto Avant', 0),
(180, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:18:04', '/live/index.html', 'Proyecto Avant', 0),
(181, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:18:07', '/live/index.html', 'Proyecto Avant', 0),
(182, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:18:10', '/live/index.html', 'Proyecto Avant', 0),
(183, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:18:13', '/live/index.html', 'Proyecto Avant', 0),
(184, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:18:16', '/live/index.html', 'Proyecto Avant', 0),
(185, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:18:27', '/live/index.html', 'Proyecto Avant', 0),
(186, 'ad66e82b-9537-48e5-b601-5bade87431e4', '2026-04-23 10:18:28', '/live/index.html', 'Proyecto Avant', 0),
(187, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 10:22:43', '/live/index.html', 'Proyecto Avant', 0),
(188, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 10:51:20', '/live/index.html', 'Proyecto Avant', 0),
(189, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 10:53:40', '/live/index.html', 'Proyecto Avant', 0),
(190, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 10:53:43', '/live/index.html', 'Proyecto Avant', 0),
(191, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 10:53:46', '/live/index.html', 'Proyecto Avant', 0),
(192, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 10:53:49', '/live/index.html', 'Proyecto Avant', 0),
(193, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 10:53:52', '/live/index.html', 'Proyecto Avant', 0),
(194, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 10:53:55', '/live/index.html', 'Proyecto Avant', 0),
(195, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 10:53:58', '/live/index.html', 'Proyecto Avant', 0),
(196, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 10:54:01', '/live/index.html', 'Proyecto Avant', 0),
(197, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 10:54:04', '/live/index.html', 'Proyecto Avant', 0),
(198, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 10:54:07', '/live/index.html', 'Proyecto Avant', 0),
(199, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 10:54:10', '/live/index.html', 'Proyecto Avant', 0),
(200, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 10:54:13', '/live/index.html', 'Proyecto Avant', 0),
(201, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 10:54:16', '/live/index.html', 'Proyecto Avant', 0),
(202, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 10:54:19', '/live/index.html', 'Proyecto Avant', 0),
(203, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 10:54:22', '/live/index.html', 'Proyecto Avant', 0),
(204, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 10:54:25', '/live/index.html', 'Proyecto Avant', 0),
(205, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 10:54:28', '/live/index.html', 'Proyecto Avant', 0),
(206, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 10:54:31', '/live/index.html', 'Proyecto Avant', 0),
(207, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 10:54:34', '/live/index.html', 'Proyecto Avant', 0),
(208, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 10:54:37', '/live/index.html', 'Proyecto Avant', 0),
(209, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 10:54:40', '/live/index.html', 'Proyecto Avant', 0),
(210, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 10:55:06', '/live/index.html', 'Proyecto Avant', 0),
(211, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 10:56:01', '/live/index.html', 'Proyecto Avant', 0),
(212, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 11:00:32', '/live/index.html', 'Proyecto Avant', 0),
(213, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 11:00:35', '/live/index.html', 'Proyecto Avant', 0),
(214, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 11:00:42', '/live/index.html', 'Proyecto Avant', 0),
(215, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 11:00:45', '/live/index.html', 'Proyecto Avant', 0),
(216, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 11:00:48', '/live/index.html', 'Proyecto Avant', 0),
(217, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 11:00:54', '/live/index.html', 'Proyecto Avant', 0),
(218, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 11:00:57', '/live/index.html', 'Proyecto Avant', 0),
(219, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 11:01:17', '/live/index.html', 'Proyecto Avant', 0),
(220, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 11:01:20', '/live/index.html', 'Proyecto Avant', 0),
(221, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 11:01:23', '/live/index.html', 'Proyecto Avant', 0),
(222, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 11:01:26', '/live/index.html', 'Proyecto Avant', 0),
(223, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 11:01:28', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(224, '88cbbc11-d5b3-4f5d-a280-25ca70070062', '2026-04-23 11:05:05', '/live/index.html', 'Proyecto Avant', 0),
(225, 'ef5d664a-b86c-4df7-9bca-3cbb2f4b3a66', '2026-04-23 11:55:08', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(226, 'ef5d664a-b86c-4df7-9bca-3cbb2f4b3a66', '2026-04-23 11:55:11', '/live/index.html', 'Proyecto Avant', 0),
(227, 'ef5d664a-b86c-4df7-9bca-3cbb2f4b3a66', '2026-04-23 11:55:27', '/live/index.html', 'Proyecto Avant', 0),
(228, 'ef5d664a-b86c-4df7-9bca-3cbb2f4b3a66', '2026-04-23 12:08:04', '/live/index.html', 'Proyecto Avant', 0),
(229, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:20:00', '/live/index.html', 'Proyecto Avant', 0),
(230, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:20:02', '/live/index.html', 'Proyecto Avant', 0),
(231, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:39:07', '/live/index.html', 'Proyecto Avant', 0),
(232, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:39:08', '/live/index.html', 'Proyecto Avant', 0),
(233, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:39:09', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(234, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:39:11', '/live/index.html', 'Proyecto Avant', 0),
(235, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:45:30', '/live/index.html', 'Proyecto Avant', 0),
(236, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:45:33', '/live/index.html', 'Proyecto Avant', 0),
(237, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:45:36', '/live/index.html', 'Proyecto Avant', 0),
(238, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:45:39', '/live/index.html', 'Proyecto Avant', 0),
(239, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:45:42', '/live/index.html', 'Proyecto Avant', 0),
(240, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:45:45', '/live/index.html', 'Proyecto Avant', 0),
(241, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:45:48', '/live/index.html', 'Proyecto Avant', 0),
(242, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:45:51', '/live/index.html', 'Proyecto Avant', 0),
(243, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:45:54', '/live/index.html', 'Proyecto Avant', 0),
(244, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:45:57', '/live/index.html', 'Proyecto Avant', 0),
(245, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:46:00', '/live/index.html', 'Proyecto Avant', 0),
(246, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:46:03', '/live/index.html', 'Proyecto Avant', 0),
(247, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:46:06', '/live/index.html', 'Proyecto Avant', 0),
(248, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:46:09', '/live/index.html', 'Proyecto Avant', 0),
(249, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:46:12', '/live/index.html', 'Proyecto Avant', 0),
(250, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:46:15', '/live/index.html', 'Proyecto Avant', 0),
(251, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:46:18', '/live/index.html', 'Proyecto Avant', 0),
(252, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:46:21', '/live/index.html', 'Proyecto Avant', 0),
(253, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:46:24', '/live/index.html', 'Proyecto Avant', 0),
(254, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:46:27', '/live/index.html', 'Proyecto Avant', 0),
(255, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:46:30', '/live/index.html', 'Proyecto Avant', 0),
(256, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:46:33', '/live/index.html', 'Proyecto Avant', 0),
(257, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:46:36', '/live/index.html', 'Proyecto Avant', 0),
(258, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:46:39', '/live/index.html', 'Proyecto Avant', 0),
(259, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:46:42', '/live/index.html', 'Proyecto Avant', 0),
(260, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:46:45', '/live/index.html', 'Proyecto Avant', 0),
(261, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:46:48', '/live/index.html', 'Proyecto Avant', 0),
(262, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:46:51', '/live/index.html', 'Proyecto Avant', 0),
(263, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:46:54', '/live/index.html', 'Proyecto Avant', 0),
(264, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:46:57', '/live/index.html', 'Proyecto Avant', 0),
(265, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:47:03', '/live/index.html', 'Proyecto Avant', 0),
(266, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:47:06', '/live/index.html', 'Proyecto Avant', 0),
(267, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:47:09', '/live/index.html', 'Proyecto Avant', 0),
(268, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:47:12', '/live/index.html', 'Proyecto Avant', 0),
(269, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:47:15', '/live/index.html', 'Proyecto Avant', 0),
(270, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:47:18', '/live/index.html', 'Proyecto Avant', 0),
(271, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:47:21', '/live/index.html', 'Proyecto Avant', 0),
(272, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:47:24', '/live/index.html', 'Proyecto Avant', 0),
(273, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:47:27', '/live/index.html', 'Proyecto Avant', 0),
(274, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:47:30', '/live/index.html', 'Proyecto Avant', 0),
(275, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:47:33', '/live/index.html', 'Proyecto Avant', 0),
(276, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:47:36', '/live/index.html', 'Proyecto Avant', 0),
(277, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:47:39', '/live/index.html', 'Proyecto Avant', 0),
(278, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:47:42', '/live/index.html', 'Proyecto Avant', 0),
(279, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:47:45', '/live/index.html', 'Proyecto Avant', 0),
(280, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:47:48', '/live/index.html', 'Proyecto Avant', 0),
(281, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:47:51', '/live/index.html', 'Proyecto Avant', 0),
(282, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:47:54', '/live/index.html', 'Proyecto Avant', 0),
(283, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:47:57', '/live/index.html', 'Proyecto Avant', 0),
(284, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:48:00', '/live/index.html', 'Proyecto Avant', 0),
(285, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:48:03', '/live/index.html', 'Proyecto Avant', 0),
(286, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:48:06', '/live/index.html', 'Proyecto Avant', 0),
(287, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:48:10', '/live/index.html', 'Proyecto Avant', 0),
(288, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:48:12', '/live/index.html', 'Proyecto Avant', 0),
(289, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:48:15', '/live/index.html', 'Proyecto Avant', 0),
(290, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:48:19', '/live/index.html', 'Proyecto Avant', 0),
(291, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:48:21', '/live/index.html', 'Proyecto Avant', 0),
(292, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:48:24', '/live/index.html', 'Proyecto Avant', 0),
(293, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:48:25', '/live/index.html', 'Proyecto Avant', 0),
(294, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:48:26', '/live/index.html', 'Proyecto Avant', 0),
(295, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:48:27', '/live/index.html', 'Proyecto Avant', 0),
(296, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:48:35', '/live/index.html', 'Proyecto Avant', 0),
(297, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:48:38', '/live/index.html', 'Proyecto Avant', 0),
(298, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:48:39', '/live/index.html', 'Proyecto Avant', 0),
(299, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:48:39', '/live/index.html', 'Proyecto Avant', 0),
(300, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:48:40', '/live/index.html', 'Proyecto Avant', 0),
(301, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:48:41', '/live/index.html', 'Proyecto Avant', 0),
(302, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:48:45', '/live/index.html', 'Proyecto Avant', 0),
(303, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:48:48', '/live/index.html', 'Proyecto Avant', 0),
(304, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:48:51', '/live/index.html', 'Proyecto Avant', 0),
(305, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:48:54', '/live/index.html', 'Proyecto Avant', 0),
(306, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:48:57', '/live/index.html', 'Proyecto Avant', 0),
(307, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:49:01', '/live/index.html', 'Proyecto Avant', 0),
(308, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:49:03', '/live/index.html', 'Proyecto Avant', 0),
(309, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:49:06', '/live/index.html', 'Proyecto Avant', 0),
(310, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:49:09', '/live/index.html', 'Proyecto Avant', 0),
(311, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:50:59', '/live/index.html', 'Proyecto Avant', 0),
(312, 'ffeb424b-6cbd-4a1f-8fc2-10e2e6230457', '2026-04-23 12:51:02', '/live/index.html', 'Proyecto Avant', 0),
(313, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:05:05', '/live/index.html', 'Proyecto Avant', 0),
(314, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:05:06', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(315, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:05:07', '/live/index.html', 'Proyecto Avant', 0),
(316, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:05:10', '/live/index.html', 'Proyecto Avant', 0),
(317, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:05:11', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(318, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:05:22', '/live/productos.html', 'AvantStore | Productos', 0),
(319, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:05:50', '/live/index.html', 'Proyecto Avant', 0),
(320, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:05:53', '/live/productos.html', 'AvantStore | Productos', 0),
(321, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:06:03', '/live/success.html', 'Mensaje Enviado', 0),
(322, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:06:05', '/live/usuarios.html', 'AvantStore | Mi Cuenta', 0),
(323, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:06:09', '/live/usuarios.html', 'AvantStore | Mi Cuenta', 0),
(324, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:06:14', '/live/productos.html', 'AvantStore | Productos', 0),
(325, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:06:15', '/live/store.html#inicio', 'AvantStore | Socios Samsung Oficiales', 0),
(326, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:06:42', '/live/usuarios.html', 'AvantStore | Mi Cuenta', 0),
(327, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:06:44', '/live/index.html', 'Proyecto Avant', 0),
(328, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:06:55', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(329, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:11:00', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(330, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:27:31', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(331, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:27:59', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(332, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:29:39', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(333, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:29:59', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(334, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:30:22', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(335, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:30:40', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(336, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:32:14', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(337, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:32:24', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(338, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:32:33', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(339, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:32:42', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(340, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:32:45', '/live/index.html', 'Proyecto Avant', 0),
(341, '725463a6-b6dd-4fcc-abbe-c53c63efc6f0', '2026-04-23 13:33:14', '/live/index.html', 'Proyecto Avant', 0),
(342, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:36:34', '/live/index.html', 'Proyecto Avant', 0),
(343, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:36:44', '/live/index.html', 'Proyecto Avant', 0),
(344, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:36:51', '/live/index.html', 'Proyecto Avant', 0),
(345, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:36:54', '/live/index.html', 'Proyecto Avant', 0),
(346, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:36:58', '/live/index.html', 'Proyecto Avant', 0),
(347, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:37:00', '/live/index.html', 'Proyecto Avant', 0),
(348, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:37:09', '/live/index.html', 'Proyecto Avant', 0),
(349, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:37:14', '/live/index.html', 'Proyecto Avant', 0),
(350, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:37:15', '/live/index.html', 'Proyecto Avant', 0),
(351, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:37:18', '/live/index.html', 'Proyecto Avant', 0),
(352, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:37:22', '/live/index.html', 'Proyecto Avant', 0),
(353, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:37:25', '/live/index.html', 'Proyecto Avant', 0),
(354, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:37:34', '/live/index.html', 'Proyecto Avant', 0),
(355, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:38:18', '/live/index.html', 'Proyecto Avant', 0),
(356, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:38:19', '/live/index.html', 'Proyecto Avant', 0),
(357, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:38:22', '/live/index.html', 'Proyecto Avant', 0),
(358, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:38:25', '/live/index.html', 'Proyecto Avant', 0),
(359, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:38:28', '/live/index.html', 'Proyecto Avant', 0),
(360, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:38:31', '/live/index.html', 'Proyecto Avant', 0),
(361, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:38:34', '/live/index.html', 'Proyecto Avant', 0),
(362, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:38:37', '/live/index.html', 'Proyecto Avant', 0),
(363, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:38:40', '/live/index.html', 'Proyecto Avant', 0),
(364, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:38:43', '/live/index.html', 'Proyecto Avant', 0),
(365, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:38:46', '/live/index.html', 'Proyecto Avant', 0),
(366, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:38:49', '/live/index.html', 'Proyecto Avant', 0),
(367, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:38:52', '/live/index.html', 'Proyecto Avant', 0),
(368, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:38:55', '/live/index.html', 'Proyecto Avant', 0),
(369, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:38:58', '/live/index.html', 'Proyecto Avant', 0),
(370, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:39:01', '/live/index.html', 'Proyecto Avant', 0),
(371, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:39:04', '/live/index.html', 'Proyecto Avant', 0),
(372, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:39:07', '/live/index.html', 'Proyecto Avant', 0),
(373, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:39:10', '/live/index.html', 'Proyecto Avant', 0),
(374, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:39:13', '/live/index.html', 'Proyecto Avant', 0),
(375, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:39:16', '/live/index.html', 'Proyecto Avant', 0),
(376, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:39:19', '/live/index.html', 'Proyecto Avant', 0),
(377, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:39:22', '/live/index.html', 'Proyecto Avant', 0),
(378, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:40:06', '/live/index.html', 'Proyecto Avant', 0),
(379, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:41:04', '/live/index.html', 'Proyecto Avant', 0),
(380, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:41:04', '/live/index.html', 'Proyecto Avant', 0),
(381, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:41:06', '/live/index.html', 'Proyecto Avant', 0),
(382, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:41:09', '/live/index.html', 'Proyecto Avant', 0),
(383, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:41:12', '/live/index.html', 'Proyecto Avant', 0),
(384, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:41:15', '/live/index.html', 'Proyecto Avant', 0),
(385, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:41:18', '/live/index.html', 'Proyecto Avant', 0),
(386, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:41:21', '/live/index.html', 'Proyecto Avant', 0),
(387, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:41:24', '/live/index.html', 'Proyecto Avant', 0),
(388, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:41:31', '/live/index.html', 'Proyecto Avant', 0),
(389, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:41:32', '/live/index.html', 'Proyecto Avant', 0),
(390, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:41:33', '/live/index.html', 'Proyecto Avant', 0),
(391, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:41:36', '/live/index.html', 'Proyecto Avant', 0),
(392, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:41:39', '/live/index.html', 'Proyecto Avant', 0),
(393, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:41:42', '/live/index.html', 'Proyecto Avant', 0),
(394, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:41:45', '/live/index.html', 'Proyecto Avant', 0),
(395, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:41:48', '/live/index.html', 'Proyecto Avant', 0),
(396, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:41:51', '/live/index.html', 'Proyecto Avant', 0),
(397, 'ed99c7e4-9aa0-49a6-a10f-16378a06eb91', '2026-04-23 13:41:54', '/live/index.html', 'Proyecto Avant', 0),
(398, '2b5ad69f-b72f-4773-bfe8-abf4be706b26', '2026-04-23 13:42:42', '/live/index.html', 'Proyecto Avant', 0),
(399, '62127b47-5a75-4ecb-b038-b20c6bfb1cb9', '2026-04-23 13:43:10', '/live/index.html', 'Proyecto Avant', 0),
(400, '62127b47-5a75-4ecb-b038-b20c6bfb1cb9', '2026-04-23 13:43:13', '/live/index.html', 'Proyecto Avant', 0),
(401, '62127b47-5a75-4ecb-b038-b20c6bfb1cb9', '2026-04-23 13:43:16', '/live/index.html', 'Proyecto Avant', 0),
(402, '62127b47-5a75-4ecb-b038-b20c6bfb1cb9', '2026-04-23 13:43:19', '/live/index.html', 'Proyecto Avant', 0),
(403, '62127b47-5a75-4ecb-b038-b20c6bfb1cb9', '2026-04-23 13:43:22', '/live/index.html', 'Proyecto Avant', 0),
(404, '62127b47-5a75-4ecb-b038-b20c6bfb1cb9', '2026-04-23 13:43:25', '/live/index.html', 'Proyecto Avant', 0),
(405, '62127b47-5a75-4ecb-b038-b20c6bfb1cb9', '2026-04-23 13:43:28', '/live/index.html', 'Proyecto Avant', 0),
(406, '62127b47-5a75-4ecb-b038-b20c6bfb1cb9', '2026-04-23 13:43:31', '/live/index.html', 'Proyecto Avant', 0),
(407, '62127b47-5a75-4ecb-b038-b20c6bfb1cb9', '2026-04-23 13:43:34', '/live/index.html', 'Proyecto Avant', 0),
(408, '62127b47-5a75-4ecb-b038-b20c6bfb1cb9', '2026-04-23 13:43:37', '/live/index.html', 'Proyecto Avant', 0),
(409, '62127b47-5a75-4ecb-b038-b20c6bfb1cb9', '2026-04-23 13:43:40', '/live/index.html', 'Proyecto Avant', 0),
(410, '62127b47-5a75-4ecb-b038-b20c6bfb1cb9', '2026-04-23 13:43:41', '/live/index.html', 'Proyecto Avant', 0),
(411, '62127b47-5a75-4ecb-b038-b20c6bfb1cb9', '2026-04-23 13:44:25', '/live/index.html', 'Proyecto Avant', 0),
(412, '62127b47-5a75-4ecb-b038-b20c6bfb1cb9', '2026-04-23 13:44:26', '/live/index.html', 'Proyecto Avant', 0),
(413, '62127b47-5a75-4ecb-b038-b20c6bfb1cb9', '2026-04-23 13:44:32', '/live/index.html', 'Proyecto Avant', 0),
(414, '62127b47-5a75-4ecb-b038-b20c6bfb1cb9', '2026-04-23 13:44:35', '/live/index.html', 'Proyecto Avant', 0),
(415, '62127b47-5a75-4ecb-b038-b20c6bfb1cb9', '2026-04-23 13:44:38', '/live/index.html', 'Proyecto Avant', 0),
(416, '62127b47-5a75-4ecb-b038-b20c6bfb1cb9', '2026-04-23 13:55:11', '/live/index.html', 'Proyecto Avant', 0),
(417, '44e6aa04-d04e-42f3-aea7-bb4734dd7a7e', '2026-04-28 11:29:00', '/live/index.html', 'Proyecto Avant', 0),
(418, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:41:25', '/live/index.html', 'Proyecto Avant', 0),
(419, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:41:27', '/live/index.html', 'Proyecto Avant', 0),
(420, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:41:30', '/live/index.html', 'Proyecto Avant', 0),
(421, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:41:33', '/live/index.html', 'Proyecto Avant', 0),
(422, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:41:36', '/live/index.html', 'Proyecto Avant', 0),
(423, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:48:35', '/live/index.html', 'Proyecto Avant', 0),
(424, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:48:36', '/live/index.html', 'Proyecto Avant', 0),
(425, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:48:37', '/live/index.html', 'Proyecto Avant', 0),
(426, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:48:57', '/live/index.html', 'Proyecto Avant', 0),
(427, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:49:00', '/live/index.html', 'Proyecto Avant', 0),
(428, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:49:03', '/live/index.html', 'Proyecto Avant', 0),
(429, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:49:06', '/live/index.html', 'Proyecto Avant', 0),
(430, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:49:09', '/live/index.html', 'Proyecto Avant', 0),
(431, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:51:41', '/live/index.html', 'Proyecto Avant', 0),
(432, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:51:44', '/live/index.html', 'Proyecto Avant', 0);
INSERT INTO `visitas` (`id`, `session_id`, `fecha`, `pagina`, `titulo`, `tiempo_seg`) VALUES
(433, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:51:47', '/live/index.html', 'Proyecto Avant', 0),
(434, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:51:50', '/live/index.html', 'Proyecto Avant', 0),
(435, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:51:53', '/live/index.html', 'Proyecto Avant', 0),
(436, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:51:56', '/live/index.html', 'Proyecto Avant', 0),
(437, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:51:59', '/live/index.html', 'Proyecto Avant', 0),
(438, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:52:02', '/live/index.html', 'Proyecto Avant', 0),
(439, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:52:05', '/live/index.html', 'Proyecto Avant', 0),
(440, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:52:08', '/live/index.html', 'Proyecto Avant', 0),
(441, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:52:08', '/live/index.html', 'Proyecto Avant', 0),
(442, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:52:10', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(443, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:52:45', '/live/index.html', 'Proyecto Avant', 0),
(444, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:53:21', '/live/index.html', 'Proyecto Avant', 0),
(445, '630c08bf-08ae-45b9-96cf-1e1c3b828fd9', '2026-04-28 11:53:22', '/live/index.html', 'Proyecto Avant', 0),
(446, 'b6b11d9b-5a73-4309-b5b2-8eff25929fc5', '2026-04-28 12:04:40', '/live/index.html', 'Proyecto Avant', 0),
(447, '1ce07df1-26e1-4238-8d06-df99ee97aa44', '2026-04-28 12:06:10', '/live/index.html', 'Proyecto Avant', 0),
(448, '6d3f9d1b-f9a1-4151-aead-c769260ec9c2', '2026-04-28 12:10:33', '/live/index.html', 'Proyecto Avant', 0),
(449, '6d3f9d1b-f9a1-4151-aead-c769260ec9c2', '2026-04-28 12:13:43', '/live/index.html', 'Proyecto Avant', 0),
(450, '6d3f9d1b-f9a1-4151-aead-c769260ec9c2', '2026-04-28 12:13:46', '/live/index.html', 'Proyecto Avant', 0),
(451, '6d3f9d1b-f9a1-4151-aead-c769260ec9c2', '2026-04-28 12:13:47', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(452, '6d3f9d1b-f9a1-4151-aead-c769260ec9c2', '2026-04-28 12:17:57', '/live/index.html', 'Proyecto Avant', 0),
(453, '6d3f9d1b-f9a1-4151-aead-c769260ec9c2', '2026-04-28 12:18:03', '/live/index.html', 'Proyecto Avant', 0),
(454, '6d3f9d1b-f9a1-4151-aead-c769260ec9c2', '2026-04-28 12:31:27', '/live/index.html', 'Proyecto Avant', 0),
(455, '6d3f9d1b-f9a1-4151-aead-c769260ec9c2', '2026-04-28 12:35:30', '/live/index.html', 'Proyecto Avant', 0),
(456, '6d3f9d1b-f9a1-4151-aead-c769260ec9c2', '2026-04-28 12:35:33', '/live/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(457, '6d3f9d1b-f9a1-4151-aead-c769260ec9c2', '2026-04-28 12:35:33', '/live/index.html', 'Proyecto Avant', 0),
(458, '6d3f9d1b-f9a1-4151-aead-c769260ec9c2', '2026-04-28 12:35:35', '/live/index.html', 'Proyecto Avant', 0),
(459, '04956821-7dad-4f1f-82f2-269669493fb4', '2026-04-28 13:06:29', '/live/index.html', 'Proyecto Avant', 0),
(460, '04956821-7dad-4f1f-82f2-269669493fb4', '2026-04-28 13:07:08', '/live/index.html', 'Proyecto Avant', 0),
(461, '04956821-7dad-4f1f-82f2-269669493fb4', '2026-04-28 13:07:10', '/live/index.html', 'Proyecto Avant', 0),
(462, '04956821-7dad-4f1f-82f2-269669493fb4', '2026-04-28 13:14:59', '/live/index.html', 'Proyecto Avant', 0),
(463, '77e6c2a8-622c-4519-8d8c-993de314bfc8', '2026-04-29 13:03:59', '/live/index.html', 'Proyecto Avant', 0),
(464, 'b9a8b1ce-fb6f-4608-9be3-e45a6b50c75c', '2026-04-29 13:30:52', '/C:/Users/Lenovo/Desktop/HAM/AvantStoreOrganitation/index.html', 'Proyecto Avant', 0),
(465, 'b9a8b1ce-fb6f-4608-9be3-e45a6b50c75c', '2026-04-29 13:30:53', '/C:/Users/Lenovo/Desktop/HAM/AvantStoreOrganitation/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(466, 'b9a8b1ce-fb6f-4608-9be3-e45a6b50c75c', '2026-04-29 13:30:56', '/C:/Users/Lenovo/Desktop/HAM/AvantStoreOrganitation/index.html', 'Proyecto Avant', 0),
(467, 'b9a8b1ce-fb6f-4608-9be3-e45a6b50c75c', '2026-04-29 13:30:58', '/C:/Users/Lenovo/Desktop/HAM/AvantStoreOrganitation/index.html', 'Proyecto Avant', 0),
(468, '2a3d3057-fb64-4441-8039-69d83808268c', '2026-04-29 13:31:04', '/C:/Users/Lenovo/Desktop/HAM/AvantStoreOrganitation/index.html', 'Proyecto Avant', 0),
(469, '2a3d3057-fb64-4441-8039-69d83808268c', '2026-04-29 13:31:05', '/C:/Users/Lenovo/Desktop/HAM/AvantStoreOrganitation/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(470, 'ce523c9e-419c-4c07-97bf-fad45497e36c', '2026-04-29 13:53:57', '/live/index.html', 'Proyecto Avant', 0),
(471, 'ce523c9e-419c-4c07-97bf-fad45497e36c', '2026-04-29 13:54:14', '/live/index.html', 'Proyecto Avant', 0),
(472, 'c5649a63-62c4-44cb-a6d5-3963517ee733', '2026-04-30 10:03:54', '/live/index.html', 'Proyecto Avant', 0),
(473, '95bb9c2a-2dd6-47ff-bbd7-431b1cfd7eb1', '2026-04-30 10:34:31', '/C:/Users/Lenovo/Desktop/HAM/AvantStoreOrganitation/index.html', 'Proyecto Avant', 0),
(474, '95bb9c2a-2dd6-47ff-bbd7-431b1cfd7eb1', '2026-04-30 10:34:34', '/C:/Users/Lenovo/Desktop/HAM/AvantStoreOrganitation/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(475, '95bb9c2a-2dd6-47ff-bbd7-431b1cfd7eb1', '2026-04-30 10:34:38', '/C:/Users/Lenovo/Desktop/HAM/AvantStoreOrganitation/index.html', 'Proyecto Avant', 0),
(476, '95bb9c2a-2dd6-47ff-bbd7-431b1cfd7eb1', '2026-04-30 10:34:42', '/C:/Users/Lenovo/Desktop/HAM/AvantStoreOrganitation/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(477, '95bb9c2a-2dd6-47ff-bbd7-431b1cfd7eb1', '2026-04-30 10:35:14', '/C:/Users/Lenovo/Desktop/HAM/AvantStoreOrganitation/index.html', 'Proyecto Avant', 0),
(478, '95bb9c2a-2dd6-47ff-bbd7-431b1cfd7eb1', '2026-04-30 10:35:26', '/C:/Users/Lenovo/Desktop/HAM/AvantStoreOrganitation/store.html', 'AvantStore | Socios Samsung Oficiales', 0),
(479, '183f7ba7-4f6d-415d-94ca-34a65b93b48a', '2026-04-30 12:31:06', '/live/index.html', 'Proyecto Avant', 0),
(480, 'aee1ac33-7073-4c72-ab23-a2bd4f59668b', '2026-04-30 12:51:31', '/live/index.html', 'Proyecto Avant', 0);

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `carrito`
--
ALTER TABLE `carrito`
  ADD CONSTRAINT `carrito_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `especificaciones`
--
ALTER TABLE `especificaciones`
  ADD CONSTRAINT `especificaciones_ibfk_1` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `eventos`
--
ALTER TABLE `eventos`
  ADD CONSTRAINT `eventos_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `sesiones` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `presupuestos`
--
ALTER TABLE `presupuestos`
  ADD CONSTRAINT `presupuestos_ibfk_1` FOREIGN KEY (`contacto_id`) REFERENCES `contactos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `store_carrito`
--
ALTER TABLE `store_carrito`
  ADD CONSTRAINT `fk_store_carrito_producto` FOREIGN KEY (`producto_id`) REFERENCES `store_productos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `store_carrito_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `store_usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `store_categorias`
--
ALTER TABLE `store_categorias`
  ADD CONSTRAINT `store_categorias_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `store_categorias` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `store_especificaciones`
--
ALTER TABLE `store_especificaciones`
  ADD CONSTRAINT `store_especificaciones_ibfk_1` FOREIGN KEY (`producto_id`) REFERENCES `store_productos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `store_eventos`
--
ALTER TABLE `store_eventos`
  ADD CONSTRAINT `store_eventos_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `store_sesiones` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `store_productos`
--
ALTER TABLE `store_productos`
  ADD CONSTRAINT `fk_store_productos_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `store_categorias` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `store_visitas`
--
ALTER TABLE `store_visitas`
  ADD CONSTRAINT `store_visitas_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `store_sesiones` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `visitas`
--
ALTER TABLE `visitas`
  ADD CONSTRAINT `visitas_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `sesiones` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

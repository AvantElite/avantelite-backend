-- ============================================================
-- Tablas de analíticas para Avantservice
-- Ejecutar en la base de datos: backendavant
-- ============================================================

USE backendavant;

-- Sesiones de usuario
CREATE TABLE IF NOT EXISTS av_sessions (
    id          VARCHAR(36)  PRIMARY KEY,
    user_id     VARCHAR(36)  NOT NULL,
    ip          VARCHAR(45)  DEFAULT '',
    device_type ENUM('desktop','mobile','tablet') DEFAULT 'desktop',
    browser     VARCHAR(80)  DEFAULT '',
    os          VARCHAR(80)  DEFAULT '',
    screen_w    INT          DEFAULT 0,
    screen_h    INT          DEFAULT 0,
    country     VARCHAR(80)  DEFAULT '',
    region      VARCHAR(80)  DEFAULT '',
    city        VARCHAR(80)  DEFAULT '',
    referrer    TEXT,
    landing_page VARCHAR(500) DEFAULT '',
    utm_source  VARCHAR(100) DEFAULT '',
    utm_medium  VARCHAR(100) DEFAULT '',
    utm_campaign VARCHAR(100) DEFAULT '',
    utm_content VARCHAR(100) DEFAULT '',
    utm_term    VARCHAR(100) DEFAULT '',
    page_count  INT          DEFAULT 1,
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_uid (user_id),
    INDEX idx_created (created_at),
    INDEX idx_device (device_type),
    INDEX idx_country (country)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Páginas vistas
CREATE TABLE IF NOT EXISTS av_pageviews (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    session_id   VARCHAR(36) NOT NULL,
    user_id      VARCHAR(36) NOT NULL,
    page         VARCHAR(500) NOT NULL,
    page_title   VARCHAR(200) DEFAULT '',
    referrer     VARCHAR(500) DEFAULT '',
    time_on_page INT         DEFAULT 0,
    scroll_depth TINYINT     DEFAULT 0,
    created_at   DATETIME    DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sid (session_id),
    INDEX idx_page (page(100)),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Eventos personalizados
CREATE TABLE IF NOT EXISTS av_events (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    session_id   VARCHAR(36) NOT NULL,
    user_id      VARCHAR(36) NOT NULL,
    page         VARCHAR(500) NOT NULL,
    event_type   VARCHAR(50)  NOT NULL,
    event_label  VARCHAR(200) DEFAULT '',
    event_value  VARCHAR(200) DEFAULT '',
    created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sid (session_id),
    INDEX idx_type (event_type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

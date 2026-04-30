-- =============================================
-- TIENDA: catálogo de categorías de producto
-- =============================================

CREATE TABLE IF NOT EXISTS store_categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL UNIQUE,
    slug VARCHAR(180) DEFAULT NULL,
    descripcion VARCHAR(500) DEFAULT NULL,
    parent_id INT DEFAULT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_parent (parent_id),
    FOREIGN KEY (parent_id) REFERENCES store_categorias(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Enlazar productos con categorías (si la columna ya existe sin FK)
SET @fk := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'store_productos'
      AND CONSTRAINT_NAME = 'fk_store_productos_categoria'
);
SET @sql := IF(@fk = 0,
    'ALTER TABLE store_productos
        ADD CONSTRAINT fk_store_productos_categoria
        FOREIGN KEY (categoria_id) REFERENCES store_categorias(id) ON DELETE SET NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

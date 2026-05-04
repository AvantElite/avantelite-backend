-- =============================================
-- TIENDA: FK store_carrito.producto_id → store_productos.id (CASCADE)
-- Limpia carritos al eliminar el producto referenciado.
-- =============================================

-- Elimina filas huérfanas previas que romperían la creación de la FK
DELETE c FROM store_carrito c
LEFT JOIN store_productos p ON p.id = c.producto_id
WHERE p.id IS NULL;

-- Crea la FK sólo si no existe
SET @fk := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'store_carrito'
      AND CONSTRAINT_NAME = 'fk_store_carrito_producto'
);
SET @sql := IF(@fk = 0,
    'ALTER TABLE store_carrito
        ADD CONSTRAINT fk_store_carrito_producto
        FOREIGN KEY (producto_id) REFERENCES store_productos(id) ON DELETE CASCADE',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

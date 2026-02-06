-- =====================================================
-- AGREGAR CAMPO PRECIO_VENTA A PRODUCTOS
-- Blancos Sinai - Precio de venta sugerido por producto
-- =====================================================

-- 1. Agregar columna precio_venta
ALTER TABLE productos
ADD COLUMN IF NOT EXISTS precio_venta DECIMAL(10,2) DEFAULT 0;

-- 2. Actualizar productos existentes con precio estimado (costo * 2)
UPDATE productos
SET precio_venta = COALESCE(costo_total_1_tinta * 2, 80)
WHERE precio_venta IS NULL OR precio_venta = 0;

-- 3. Crear índice para consultas
CREATE INDEX IF NOT EXISTS idx_productos_precio_venta ON productos(precio_venta);

-- 4. Verificación
SELECT id, linea_nombre, costo_total_1_tinta, precio_venta
FROM productos
WHERE activo = true
ORDER BY created_at DESC;

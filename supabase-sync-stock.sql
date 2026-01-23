-- =====================================================
-- MIGRACION: Sincronizar stocks desde movimientos existentes
-- =====================================================
-- Ejecutar en: Supabase > SQL Editor > New Query
-- Este script calcula los stocks correctos basandose en
-- los movimientos registrados en movimientos_stock
-- =====================================================

-- Primero, resetear los stocks a 0
UPDATE productos SET stock_consignacion = 0;

-- Calcular stock_consignacion sumando movimientos de consignacion
-- y restando ventas_consignacion y devoluciones
WITH calculos AS (
  SELECT
    producto_id,
    SUM(
      CASE
        WHEN tipo_movimiento = 'consignacion' THEN cantidad
        WHEN tipo_movimiento = 'venta_consignacion' THEN -cantidad
        WHEN tipo_movimiento = 'devolucion' THEN -cantidad
        ELSE 0
      END
    ) as stock_consig
  FROM movimientos_stock
  GROUP BY producto_id
)
UPDATE productos p
SET stock_consignacion = GREATEST(0, c.stock_consig)
FROM calculos c
WHERE p.id = c.producto_id;

-- Actualizar stock en taller restando lo que salio por consignacion y ventas directas
WITH calculos AS (
  SELECT
    producto_id,
    SUM(
      CASE
        WHEN tipo_movimiento = 'consignacion' THEN cantidad
        WHEN tipo_movimiento = 'venta_directa' THEN cantidad
        WHEN tipo_movimiento = 'devolucion' THEN -cantidad
        ELSE 0
      END
    ) as salidas
  FROM movimientos_stock
  GROUP BY producto_id
)
UPDATE productos p
SET stock = GREATEST(0, COALESCE(p.stock, 0) - COALESCE(c.salidas, 0))
FROM calculos c
WHERE p.id = c.producto_id;

-- Verificar resultados
SELECT
  p.id,
  p.linea_nombre,
  p.stock as "Stock Taller",
  p.stock_consignacion as "Stock Consignacion",
  (p.stock + p.stock_consignacion) as "Total"
FROM productos p
WHERE p.activo = true
ORDER BY p.linea_nombre;

-- =====================================================
-- FIN DE LA MIGRACION
-- =====================================================

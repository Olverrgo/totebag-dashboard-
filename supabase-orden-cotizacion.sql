-- =====================================================
-- ÓRDENES DE PRODUCCIÓN ← COTIZACIÓN: trazabilidad
-- =====================================================
-- Cuando una cotización aceptada no se puede vender por falta de stock terminado,
-- se generan órdenes de producción por el FALTANTE (una por variante). Esta columna
-- liga cada orden a la cotización que la originó, para seguir el rastro
-- "Orden generada de COT-AAAA-NNN".
-- Script idempotente (se puede correr varias veces).

ALTER TABLE ordenes_produccion
  ADD COLUMN IF NOT EXISTS cotizacion_folio TEXT;

-- =====================================================
-- VERIFICACIÓN (opcional, correr a mano)
-- =====================================================
-- SELECT id, producto_id, variante_id, cantidad, estado, cotizacion_folio, created_at
--   FROM ordenes_produccion
--  WHERE cotizacion_folio IS NOT NULL
--  ORDER BY created_at DESC;

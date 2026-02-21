-- ============================================================
-- SCRIPT DE RECONCILIACION DE MOVIMIENTOS DE CONSIGNACION
-- Ejecutar UNA SOLA VEZ para crear movimientos de tipo
-- 'venta_consignacion' faltantes para pagos ya realizados.
-- ============================================================
-- Problema: los pagos desde VentasView no creaban movimiento_stock,
-- causando que SalidasView muestre piezas como "en consignacion activa"
-- cuando ya fueron pagadas.
-- ============================================================

-- PASO 1: Ver que movimientos se van a crear (solo lectura)
-- Descomenta para revisar antes de ejecutar:

-- SELECT
--   v.id as venta_id,
--   v.producto_id,
--   v.variante_id,
--   v.cliente_id,
--   v.producto_nombre,
--   v.cantidad,
--   v.precio_unitario,
--   v.monto_pagado,
--   v.estado_pago,
--   ROUND(v.monto_pagado / NULLIF(v.precio_unitario, 0)) as piezas_pagadas
-- FROM ventas v
-- WHERE v.tipo_venta = 'consignacion'
--   AND v.monto_pagado > 0
--   AND v.precio_unitario > 0
--   AND NOT EXISTS (
--     SELECT 1 FROM movimientos_stock ms
--     WHERE ms.tipo_movimiento = 'venta_consignacion'
--       AND ms.producto_id = v.producto_id
--       AND ms.cliente_id = v.cliente_id
--       AND COALESCE(ms.variante_id, 0) = COALESCE(v.variante_id, 0)
--       AND ms.cantidad = ROUND(v.monto_pagado / NULLIF(v.precio_unitario, 0))
--   )
-- ORDER BY v.created_at;

-- ============================================================
-- PASO 2: Crear movimientos de venta_consignacion faltantes
-- ============================================================

INSERT INTO movimientos_stock (producto_id, variante_id, cliente_id, tipo_movimiento, cantidad, notas)
SELECT
  v.producto_id,
  v.variante_id,
  v.cliente_id,
  'venta_consignacion',
  ROUND(v.monto_pagado / NULLIF(v.precio_unitario, 0)),
  'Reconciliación - Cobro registrado desde Ventas'
FROM ventas v
WHERE v.tipo_venta = 'consignacion'
  AND v.monto_pagado > 0
  AND v.precio_unitario > 0
  AND ROUND(v.monto_pagado / NULLIF(v.precio_unitario, 0)) > 0;

-- ============================================================
-- PASO 3: Verificar (descomenta para confirmar)
-- ============================================================

-- SELECT
--   ms.producto_id,
--   ms.variante_id,
--   ms.cliente_id,
--   ms.tipo_movimiento,
--   ms.cantidad,
--   ms.notas,
--   ms.created_at
-- FROM movimientos_stock ms
-- WHERE ms.tipo_movimiento = 'venta_consignacion'
-- ORDER BY ms.created_at DESC
-- LIMIT 20;

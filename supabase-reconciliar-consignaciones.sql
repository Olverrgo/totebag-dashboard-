-- ============================================================
-- SCRIPT DE RECONCILIACION DE STOCK DE CONSIGNACION
-- Ejecutar UNA SOLA VEZ para sincronizar stock_consignacion
-- con los pagos ya registrados antes del fix.
-- ============================================================
-- Problema: los pagos anteriores actualizaban monto_pagado
-- pero NO reducian stock_consignacion. Este script corrige eso.
-- ============================================================

-- PASO 1: Verificar estado actual (solo lectura, para revisar antes de ejecutar)
-- Descomenta este bloque para ver que se va a modificar:

-- SELECT
--   v.id as venta_id,
--   v.producto_id,
--   v.variante_id,
--   p.linea_nombre,
--   v.cantidad,
--   v.precio_unitario,
--   v.total,
--   v.monto_pagado,
--   v.estado_pago,
--   ROUND(v.monto_pagado / NULLIF(v.precio_unitario, 0)) as piezas_pagadas,
--   CASE
--     WHEN v.variante_id IS NOT NULL THEN vp.stock_consignacion
--     ELSE p.stock_consignacion
--   END as stock_consignacion_actual
-- FROM ventas v
-- JOIN productos p ON p.id = v.producto_id
-- LEFT JOIN variantes_producto vp ON vp.id = v.variante_id
-- WHERE v.tipo_venta = 'consignacion'
--   AND v.monto_pagado > 0
--   AND v.precio_unitario > 0
-- ORDER BY v.producto_id, v.variante_id;

-- ============================================================
-- PASO 2: Reducir stock_consignacion de VARIANTES
-- Para ventas de consignacion con variante_id que ya fueron pagadas
-- ============================================================

WITH piezas_por_variante AS (
  SELECT
    variante_id,
    SUM(ROUND(monto_pagado / NULLIF(precio_unitario, 0))) AS total_piezas_pagadas
  FROM ventas
  WHERE tipo_venta = 'consignacion'
    AND monto_pagado > 0
    AND variante_id IS NOT NULL
    AND precio_unitario > 0
  GROUP BY variante_id
)
UPDATE variantes_producto vp
SET stock_consignacion = GREATEST(0, COALESCE(vp.stock_consignacion, 0) - pp.total_piezas_pagadas)
FROM piezas_por_variante pp
WHERE vp.id = pp.variante_id;

-- ============================================================
-- PASO 3: Reducir stock_consignacion de PRODUCTOS (sin variante)
-- Para ventas de consignacion sin variante_id que ya fueron pagadas
-- ============================================================

WITH piezas_por_producto AS (
  SELECT
    producto_id,
    SUM(ROUND(monto_pagado / NULLIF(precio_unitario, 0))) AS total_piezas_pagadas
  FROM ventas
  WHERE tipo_venta = 'consignacion'
    AND monto_pagado > 0
    AND variante_id IS NULL
    AND precio_unitario > 0
  GROUP BY producto_id
)
UPDATE productos p
SET stock_consignacion = GREATEST(0, COALESCE(p.stock_consignacion, 0) - pp.total_piezas_pagadas)
FROM piezas_por_producto pp
WHERE p.id = pp.producto_id;

-- ============================================================
-- PASO 4: Verificar resultado (descomenta para confirmar)
-- ============================================================

-- SELECT
--   p.linea_nombre,
--   p.stock,
--   p.stock_consignacion,
--   COALESCE(
--     (SELECT SUM(vp2.stock_consignacion) FROM variantes_producto vp2 WHERE vp2.producto_id = p.id AND vp2.activo = true),
--     0
--   ) as consig_variantes
-- FROM productos p
-- WHERE p.activo = true
-- ORDER BY p.linea_nombre;

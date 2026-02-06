-- =====================================================
-- MIGRACIÓN: Consignaciones existentes a Ventas
-- Blancos Sinai - Sincronización de cuentas por cobrar
-- =====================================================
-- EJECUTAR UNA SOLA VEZ para migrar consignaciones históricas

-- =====================================================
-- 1. CREAR VENTAS PENDIENTES PARA CONSIGNACIONES ACTIVAS
-- =====================================================
-- Calcula el neto por cliente/producto y crea registros de venta

INSERT INTO ventas (
  producto_id,
  cliente_id,
  producto_nombre,
  producto_medidas,
  cliente_nombre,
  cantidad,
  precio_unitario,
  total,
  costo_unitario,
  tipo_venta,
  estado_pago,
  monto_pagado,
  notas,
  created_at
)
SELECT
  consig.producto_id,
  consig.cliente_id,
  p.linea_nombre as producto_nombre,
  p.linea_medidas as producto_medidas,
  c.nombre as cliente_nombre,
  consig.cantidad_neta as cantidad,
  -- Usar costo * 2 como precio estimado (margen 100%)
  COALESCE(p.costo_total_1_tinta * 2, 80) as precio_unitario,
  consig.cantidad_neta * COALESCE(p.costo_total_1_tinta * 2, 80) as total,
  COALESCE(p.costo_total_1_tinta, 0) as costo_unitario,
  'consignacion' as tipo_venta,
  'pendiente' as estado_pago,
  0 as monto_pagado,
  'Migración automática de consignaciones existentes - ' || NOW()::date as notas,
  consig.fecha_primera_consignacion as created_at
FROM (
  -- Subconsulta: calcular cantidad neta por producto/cliente
  SELECT
    m.producto_id,
    m.cliente_id,
    -- Neto = consignaciones - ventas_consignacion - devoluciones
    SUM(CASE WHEN m.tipo_movimiento = 'consignacion' THEN m.cantidad ELSE 0 END) -
    SUM(CASE WHEN m.tipo_movimiento = 'venta_consignacion' THEN m.cantidad ELSE 0 END) -
    SUM(CASE WHEN m.tipo_movimiento = 'devolucion' THEN m.cantidad ELSE 0 END) as cantidad_neta,
    MIN(CASE WHEN m.tipo_movimiento = 'consignacion' THEN m.fecha END) as fecha_primera_consignacion
  FROM movimientos_stock m
  GROUP BY m.producto_id, m.cliente_id
  HAVING
    -- Solo si hay cantidad neta positiva (aún hay piezas en consignación)
    SUM(CASE WHEN m.tipo_movimiento = 'consignacion' THEN m.cantidad ELSE 0 END) -
    SUM(CASE WHEN m.tipo_movimiento = 'venta_consignacion' THEN m.cantidad ELSE 0 END) -
    SUM(CASE WHEN m.tipo_movimiento = 'devolucion' THEN m.cantidad ELSE 0 END) > 0
) consig
JOIN productos p ON p.id = consig.producto_id
JOIN clientes c ON c.id = consig.cliente_id
-- Evitar duplicados: solo insertar si no existe ya una venta de consignación pendiente
WHERE NOT EXISTS (
  SELECT 1 FROM ventas v
  WHERE v.producto_id = consig.producto_id
    AND v.cliente_id = consig.cliente_id
    AND v.tipo_venta = 'consignacion'
    AND v.estado_pago IN ('pendiente', 'parcial')
    AND v.activo = true
);

-- =====================================================
-- 2. VERIFICACIÓN
-- =====================================================
-- Ejecuta estas consultas para verificar la migración:

-- Ver consignaciones migradas:
-- SELECT * FROM ventas WHERE tipo_venta = 'consignacion' AND notas LIKE 'Migración%';

-- Comparar con stock en consignación:
-- SELECT
--   p.id,
--   p.linea_nombre,
--   p.stock_consignacion,
--   COALESCE(SUM(v.cantidad), 0) as en_ventas_pendientes
-- FROM productos p
-- LEFT JOIN ventas v ON v.producto_id = p.id
--   AND v.tipo_venta = 'consignacion'
--   AND v.estado_pago = 'pendiente'
--   AND v.activo = true
-- WHERE p.stock_consignacion > 0
-- GROUP BY p.id, p.linea_nombre, p.stock_consignacion;

-- =====================================================
-- 3. RESUMEN POST-MIGRACIÓN
-- =====================================================
SELECT
  'Consignaciones migradas' as concepto,
  COUNT(*) as registros,
  SUM(cantidad) as piezas_totales,
  SUM(total) as monto_total
FROM ventas
WHERE tipo_venta = 'consignacion'
  AND estado_pago = 'pendiente'
  AND activo = true;

-- =====================================================
-- RECLASIFICAR COMPRAS DE MATERIAL COMO INVERSIÓN DE CAPITAL
-- Ejecutar UNA SOLA VEZ en Supabase SQL Editor
-- =====================================================
-- Los egresos de compra_material representan inversión (capital inyectado),
-- no gastos operativos. Se reclasifican para que la caja no se vea
-- artificialmente negativa. El valor de esos materiales ahora se trackea
-- en la tabla 'materiales' (inventario real).

-- Ver cuántos registros se van a actualizar:
SELECT COUNT(*), SUM(monto) as total_inversion
FROM movimientos_caja
WHERE categoria = 'compra_material' AND activo = true;

-- Reclasificar: egreso compra_material → ingreso inversion_capital
UPDATE movimientos_caja
SET tipo = 'ingreso',
    categoria = 'inversion_capital',
    descripcion = '[Inversión] ' || COALESCE(descripcion, 'Compra de material')
WHERE categoria = 'compra_material'
  AND activo = true;

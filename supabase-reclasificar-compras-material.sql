-- =====================================================
-- RECLASIFICAR COMPRAS DE MATERIAL COMO INVERSIÓN DE CAPITAL
-- Ejecutar UNA SOLA VEZ en Supabase SQL Editor
-- =====================================================

-- Paso 1: Eliminar constraint viejo de categoria
ALTER TABLE movimientos_caja DROP CONSTRAINT movimientos_caja_categoria_check;

-- Paso 2: Recrear constraint con 'inversion_capital' incluido
ALTER TABLE movimientos_caja ADD CONSTRAINT movimientos_caja_categoria_check
  CHECK ((categoria)::text = ANY (ARRAY[
    'venta'::character varying,
    'cobro_consignacion'::character varying,
    'cobro_maquila'::character varying,
    'otro_ingreso'::character varying,
    'compra_material'::character varying,
    'gasto_operativo'::character varying,
    'pago_proveedor'::character varying,
    'otro_egreso'::character varying,
    'inversion_capital'::character varying
  ]::text[]));

-- Paso 3: Reclasificar egresos compra_material → ingresos inversion_capital
UPDATE movimientos_caja
SET tipo = 'ingreso',
    categoria = 'inversion_capital',
    descripcion = '[Inversión] ' || COALESCE(descripcion, 'Compra de material')
WHERE categoria = 'compra_material'
  AND activo = true;

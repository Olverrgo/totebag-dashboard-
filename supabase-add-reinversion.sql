-- Agregar 'reinversion' como categoría válida en movimientos_caja
-- Ejecutar UNA VEZ en el SQL Editor de Supabase

-- 1. Eliminar constraint actual
ALTER TABLE movimientos_caja DROP CONSTRAINT IF EXISTS movimientos_caja_categoria_check;

-- 2. Recrear con 'reinversion' incluido
ALTER TABLE movimientos_caja ADD CONSTRAINT movimientos_caja_categoria_check
  CHECK (categoria IN (
    'venta', 'cobro_venta', 'cobro_consignacion', 'pago_consignacion', 'pago_cliente',
    'compra_material', 'gasto_operativo', 'gasto_envio', 'gasto_produccion',
    'retiro', 'ajuste', 'otro', 'inversion_capital', 'reinversion'
  ));

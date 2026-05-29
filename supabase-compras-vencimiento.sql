-- =====================================================
-- ADICIÓN DE FECHAS DE CONTROL PARA CUENTAS POR PAGAR
-- =====================================================

-- 1. Agregar fecha de vencimiento a las compras
ALTER TABLE compras_material 
ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE;

-- Comentario: La fecha_pago en pagos_proveedores ya existe como TIMESTAMPTZ.
-- No requiere cambios en el esquema, solo en la UI para permitir enviarla.

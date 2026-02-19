-- =====================================================
-- TABLA: movimientos_caja
-- Sistema de registro de caja para Blancos Sinai
-- =====================================================

-- Crear tabla
CREATE TABLE IF NOT EXISTS movimientos_caja (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
  monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
  venta_id INTEGER REFERENCES ventas(id) ON DELETE SET NULL,
  categoria VARCHAR(50) DEFAULT 'venta'
    CHECK (categoria IN (
      'venta', 'pago_consignacion', 'pago_cliente',
      'compra_material', 'gasto_operativo', 'gasto_envio',
      'gasto_produccion', 'retiro', 'otro'
    )),
  metodo_pago VARCHAR(50) DEFAULT 'efectivo'
    CHECK (metodo_pago IN ('efectivo', 'transferencia', 'tarjeta', 'otro')),
  descripcion TEXT,
  referencia VARCHAR(200),
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  activo BOOLEAN DEFAULT true
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_tipo ON movimientos_caja(tipo);
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_fecha ON movimientos_caja(fecha);
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_categoria ON movimientos_caja(categoria);
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_venta_id ON movimientos_caja(venta_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_activo ON movimientos_caja(activo);

-- RLS (Row Level Security)
ALTER TABLE movimientos_caja ENABLE ROW LEVEL SECURITY;

-- Lectura: usuarios autenticados
DROP POLICY IF EXISTS "movimientos_caja_select" ON movimientos_caja;
CREATE POLICY "movimientos_caja_select" ON movimientos_caja
  FOR SELECT TO authenticated
  USING (true);

-- Insercion: solo admin
DROP POLICY IF EXISTS "movimientos_caja_insert" ON movimientos_caja;
CREATE POLICY "movimientos_caja_insert" ON movimientos_caja
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Actualizacion: solo admin
DROP POLICY IF EXISTS "movimientos_caja_update" ON movimientos_caja;
CREATE POLICY "movimientos_caja_update" ON movimientos_caja
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

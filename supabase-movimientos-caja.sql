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

-- =====================================================
-- MIGRACIÓN: Importar ventas existentes ya cobradas
-- Ejecutar UNA sola vez después de crear la tabla
-- =====================================================

-- 1. Ventas directas pagadas (monto_pagado completo)
INSERT INTO movimientos_caja (tipo, monto, venta_id, categoria, metodo_pago, descripcion, fecha, created_at)
SELECT
  'ingreso',
  v.monto_pagado,
  v.id,
  'venta',
  COALESCE(v.metodo_pago, 'efectivo'),
  'Venta directa - ' || COALESCE(v.producto_nombre, 'Producto') || ' - ' || v.cantidad || ' pzas',
  COALESCE(v.fecha_pago, v.created_at),
  COALESCE(v.fecha_pago, v.created_at)
FROM ventas v
WHERE v.activo = true
  AND v.tipo_venta = 'directa'
  AND v.estado_pago = 'pagado'
  AND v.monto_pagado > 0;

-- 2. Consignaciones totalmente pagadas
INSERT INTO movimientos_caja (tipo, monto, venta_id, categoria, metodo_pago, descripcion, fecha, created_at)
SELECT
  'ingreso',
  v.monto_pagado,
  v.id,
  'pago_consignacion',
  COALESCE(v.metodo_pago, 'efectivo'),
  'Pago consignación - ' || COALESCE(v.producto_nombre, 'Producto') || ' - ' || COALESCE(v.cliente_nombre, 'Cliente') || ' - ' || v.cantidad || ' pzas',
  COALESCE(v.fecha_pago, v.created_at),
  COALESCE(v.fecha_pago, v.created_at)
FROM ventas v
WHERE v.activo = true
  AND v.tipo_venta = 'consignacion'
  AND v.estado_pago = 'pagado'
  AND v.monto_pagado > 0;

-- 3. Consignaciones con pago parcial (registrar lo que ya se cobró)
INSERT INTO movimientos_caja (tipo, monto, venta_id, categoria, metodo_pago, descripcion, fecha, created_at)
SELECT
  'ingreso',
  v.monto_pagado,
  v.id,
  'pago_consignacion',
  COALESCE(v.metodo_pago, 'efectivo'),
  'Pago parcial consignación - ' || COALESCE(v.producto_nombre, 'Producto') || ' - ' || COALESCE(v.cliente_nombre, 'Cliente'),
  v.created_at,
  v.created_at
FROM ventas v
WHERE v.activo = true
  AND v.tipo_venta = 'consignacion'
  AND v.estado_pago = 'parcial'
  AND v.monto_pagado > 0;

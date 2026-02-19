-- =====================================================
-- TABLA: servicios_maquila
-- Registro de servicios de maquila para Blancos Sinai
-- =====================================================

CREATE TABLE IF NOT EXISTS servicios_maquila (
  id SERIAL PRIMARY KEY,
  maquila VARCHAR(200) NOT NULL,
  tipo_producto VARCHAR(200) NOT NULL,
  producto_id INTEGER REFERENCES productos(id) ON DELETE SET NULL,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nombre VARCHAR(200),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  costo_unitario DECIMAL(10,2) NOT NULL CHECK (costo_unitario >= 0),
  total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
  estado_pago VARCHAR(20) DEFAULT 'pendiente'
    CHECK (estado_pago IN ('pagado', 'pendiente', 'parcial')),
  monto_pagado DECIMAL(10,2) DEFAULT 0,
  metodo_pago VARCHAR(50) DEFAULT 'efectivo'
    CHECK (metodo_pago IN ('efectivo', 'transferencia', 'tarjeta', 'otro')),
  fecha DATE DEFAULT CURRENT_DATE,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  activo BOOLEAN DEFAULT true
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_servicios_maquila_maquila ON servicios_maquila(maquila);
CREATE INDEX IF NOT EXISTS idx_servicios_maquila_estado ON servicios_maquila(estado_pago);
CREATE INDEX IF NOT EXISTS idx_servicios_maquila_fecha ON servicios_maquila(fecha);
CREATE INDEX IF NOT EXISTS idx_servicios_maquila_activo ON servicios_maquila(activo);
CREATE INDEX IF NOT EXISTS idx_servicios_maquila_cliente ON servicios_maquila(cliente_id);

-- RLS
ALTER TABLE servicios_maquila ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "servicios_maquila_select" ON servicios_maquila;
CREATE POLICY "servicios_maquila_select" ON servicios_maquila
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "servicios_maquila_insert" ON servicios_maquila;
CREATE POLICY "servicios_maquila_insert" ON servicios_maquila
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

DROP POLICY IF EXISTS "servicios_maquila_update" ON servicios_maquila;
CREATE POLICY "servicios_maquila_update" ON servicios_maquila
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

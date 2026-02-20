-- =====================================================
-- TABLA DE RESURTIDOS - Historial de compras/resurtidos
-- Para categorías de compra/reventa (Dulces, Botanas, Cortinas, etc.)
-- =====================================================

-- Crear tabla de resurtidos
CREATE TABLE IF NOT EXISTS resurtidos (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER REFERENCES productos(id) ON DELETE CASCADE,
  variante_id INTEGER REFERENCES variantes_producto(id) ON DELETE SET NULL,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  costo_unitario DECIMAL(10,2) NOT NULL CHECK (costo_unitario >= 0),
  costo_total DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * costo_unitario) STORED,
  cliente_id INTEGER REFERENCES clientes(id),
  cliente_nombre VARCHAR(200),
  precio_venta DECIMAL(10,2) DEFAULT 0,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  activo BOOLEAN DEFAULT true
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_resurtidos_producto_id ON resurtidos(producto_id);
CREATE INDEX IF NOT EXISTS idx_resurtidos_fecha ON resurtidos(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_resurtidos_producto_fecha ON resurtidos(producto_id, fecha DESC);

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

ALTER TABLE resurtidos ENABLE ROW LEVEL SECURITY;

-- Lectura: usuarios autenticados
DROP POLICY IF EXISTS "resurtidos_select_policy" ON resurtidos;
CREATE POLICY "resurtidos_select_policy" ON resurtidos
  FOR SELECT
  TO authenticated
  USING (true);

-- Inserción: solo admin
DROP POLICY IF EXISTS "resurtidos_insert_policy" ON resurtidos;
CREATE POLICY "resurtidos_insert_policy" ON resurtidos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Actualización: solo admin
DROP POLICY IF EXISTS "resurtidos_update_policy" ON resurtidos;
CREATE POLICY "resurtidos_update_policy" ON resurtidos
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Eliminación: solo admin
DROP POLICY IF EXISTS "resurtidos_delete_policy" ON resurtidos;
CREATE POLICY "resurtidos_delete_policy" ON resurtidos
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

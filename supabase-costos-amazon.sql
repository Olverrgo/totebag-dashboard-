-- =====================================================
-- MIGRACION: Tabla para costos Amazon (editables)
-- =====================================================
-- Ejecutar en: Supabase > SQL Editor > New Query
-- =====================================================

-- Crear tabla para almacenar costos Amazon
CREATE TABLE IF NOT EXISTS costos_amazon (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Costos de producción
  material DECIMAL(10,2) DEFAULT 6.25,
  maquila DECIMAL(10,2) DEFAULT 6.00,
  insumos DECIMAL(10,2) DEFAULT 1.50,
  merma DECIMAL(10,2) DEFAULT 0.75,
  -- Parámetros Amazon
  amazon_comision DECIMAL(5,2) DEFAULT 15,
  amazon_fba_fee DECIMAL(10,2) DEFAULT 55,
  amazon_envio_bodega DECIMAL(10,2) DEFAULT 15,
  precio_base_mayoreo DECIMAL(10,2) DEFAULT 45,
  piezas_por_envio_fba INTEGER DEFAULT 10,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar registro inicial con valores por defecto
INSERT INTO costos_amazon (
  material, maquila, insumos, merma,
  amazon_comision, amazon_fba_fee, amazon_envio_bodega,
  precio_base_mayoreo, piezas_por_envio_fba
) VALUES (
  6.25, 6.00, 1.50, 0.75,
  15, 55, 15,
  45, 10
) ON CONFLICT DO NOTHING;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_costos_amazon_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS costos_amazon_updated_at ON costos_amazon;
CREATE TRIGGER costos_amazon_updated_at
  BEFORE UPDATE ON costos_amazon
  FOR EACH ROW
  EXECUTE FUNCTION update_costos_amazon_updated_at();

-- Políticas RLS
ALTER TABLE costos_amazon ENABLE ROW LEVEL SECURITY;

-- Todos los usuarios autenticados pueden leer
CREATE POLICY "Usuarios autenticados pueden leer costos" ON costos_amazon
  FOR SELECT USING (auth.role() = 'authenticated');

-- Solo admins pueden actualizar (verificar rol en user_profiles)
CREATE POLICY "Solo admins pueden actualizar costos" ON costos_amazon
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.rol = 'admin'
    )
  );

-- Solo admins pueden insertar
CREATE POLICY "Solo admins pueden insertar costos" ON costos_amazon
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.rol = 'admin'
    )
  );

-- =====================================================
-- FIN DE LA MIGRACION
-- =====================================================

-- =====================================================
-- TABLAS PARA PRODUCTOS Y CONFIGURACIÓN ADMIN
-- =====================================================
-- Ejecutar en Supabase > SQL Editor > New Query
-- =====================================================

-- 1. Tipos de tela (solo admin puede editar)
CREATE TABLE IF NOT EXISTS tipos_tela (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  ancho DECIMAL(5,2) NOT NULL,
  precio_metro DECIMAL(10,2) NOT NULL,
  activo BOOLEAN DEFAULT true,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Configuración de envío (solo admin puede editar)
CREATE TABLE IF NOT EXISTS config_envio (
  id SERIAL PRIMARY KEY,
  zona VARCHAR(100) NOT NULL,
  costo_envio DECIMAL(10,2) NOT NULL,
  min_piezas INTEGER NOT NULL DEFAULT 20,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Productos (modelos de cada línea)
CREATE TABLE IF NOT EXISTS productos (
  id SERIAL PRIMARY KEY,
  linea_id VARCHAR(50) NOT NULL,
  linea_nombre VARCHAR(100) NOT NULL,
  linea_medidas VARCHAR(50),
  descripcion TEXT,
  tipo_tela_id INTEGER REFERENCES tipos_tela(id),
  cantidad_tela DECIMAL(10,2) DEFAULT 0,
  piezas_por_corte INTEGER DEFAULT 1,
  costo_maquila DECIMAL(10,2) DEFAULT 0,
  insumos DECIMAL(10,2) DEFAULT 0,
  merma DECIMAL(5,2) DEFAULT 5,
  serigrafia_1_tinta DECIMAL(10,2) DEFAULT 0,
  serigrafia_2_tintas DECIMAL(10,2) DEFAULT 0,
  serigrafia_3_tintas DECIMAL(10,2) DEFAULT 0,
  empaque DECIMAL(10,2) DEFAULT 0,
  envio_id INTEGER REFERENCES config_envio(id),
  costo_total_1_tinta DECIMAL(10,2) DEFAULT 0,
  costo_total_2_tintas DECIMAL(10,2) DEFAULT 0,
  costo_total_3_tintas DECIMAL(10,2) DEFAULT 0,
  costo_total_4_tintas DECIMAL(10,2) DEFAULT 0,
  tipo_entrega VARCHAR(20) DEFAULT 'envio',
  stock INTEGER DEFAULT 0,
  stock_consignacion INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_productos_linea ON productos(linea_id);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);
CREATE INDEX IF NOT EXISTS idx_tipos_tela_activo ON tipos_tela(activo);
CREATE INDEX IF NOT EXISTS idx_config_envio_activo ON config_envio(activo);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

DROP TRIGGER IF EXISTS update_tipos_tela_updated_at ON tipos_tela;
CREATE TRIGGER update_tipos_tela_updated_at
  BEFORE UPDATE ON tipos_tela
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_config_envio_updated_at ON config_envio;
CREATE TRIGGER update_config_envio_updated_at
  BEFORE UPDATE ON config_envio
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_productos_updated_at ON productos;
CREATE TRIGGER update_productos_updated_at
  BEFORE UPDATE ON productos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE tipos_tela ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_envio ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- Lectura pública para todos
CREATE POLICY "Lectura pública tipos_tela" ON tipos_tela FOR SELECT USING (true);
CREATE POLICY "Lectura pública config_envio" ON config_envio FOR SELECT USING (true);
CREATE POLICY "Lectura pública productos" ON productos FOR SELECT USING (true);

-- Escritura solo para usuarios autenticados
CREATE POLICY "Escritura autenticada tipos_tela" ON tipos_tela FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Escritura autenticada config_envio" ON config_envio FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Escritura autenticada productos" ON productos FOR ALL USING (auth.uid() IS NOT NULL);

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Tipos de tela iniciales
INSERT INTO tipos_tela (nombre, ancho, precio_metro, orden) VALUES
  ('Manta cruda (básica)', 1.80, 25.00, 1),
  ('Manta teñida (forro)', 1.60, 42.00, 2),
  ('Loneta estampada', 1.60, 69.00, 3),
  ('Loneta estampada (ancha)', 2.50, 69.00, 4)
ON CONFLICT DO NOTHING;

-- Configuración de envío inicial
INSERT INTO config_envio (zona, costo_envio, min_piezas) VALUES
  ('Zona Conurbada Puebla', 100.00, 20)
ON CONFLICT DO NOTHING;

-- =====================================================
-- FIN
-- =====================================================

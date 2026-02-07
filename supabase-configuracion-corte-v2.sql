-- =====================================================
-- CONFIGURACIÓN DE CORTE V2 - Blancos Sinai
-- Versión simplificada con metros lineales directos
-- =====================================================

-- Eliminar tabla anterior si existe
DROP TABLE IF EXISTS configuraciones_corte CASCADE;

-- =====================================================
-- 1. TABLA CONFIGURACIONES_CORTE (Simplificada)
-- =====================================================
CREATE TABLE configuraciones_corte (
  id SERIAL PRIMARY KEY,

  -- Relaciones
  producto_id INTEGER REFERENCES productos(id) ON DELETE CASCADE,
  variante_id INTEGER REFERENCES variantes_producto(id) ON DELETE SET NULL,

  -- Nombre descriptivo
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,

  -- Metros lineales por pieza (entrada directa)
  metros_sabana_plana DECIMAL(10,2) DEFAULT 0,
  incluye_sabana_plana BOOLEAN DEFAULT true,

  metros_sabana_cajon DECIMAL(10,2) DEFAULT 0,
  incluye_sabana_cajon BOOLEAN DEFAULT true,

  metros_fundas DECIMAL(10,2) DEFAULT 0, -- metros por funda
  cantidad_fundas INTEGER DEFAULT 2,
  incluye_fundas BOOLEAN DEFAULT true,

  -- Configuración
  porcentaje_desperdicio DECIMAL(5,2) DEFAULT 10,

  -- Precio y costos
  precio_tela_metro DECIMAL(10,2) NOT NULL DEFAULT 0,
  costo_confeccion DECIMAL(10,2) DEFAULT 0,
  costo_empaque DECIMAL(10,2) DEFAULT 0,

  -- Cálculos (se actualizan con trigger)
  total_metros_lineales DECIMAL(10,2),
  costo_material DECIMAL(10,2),
  costo_total DECIMAL(10,2),

  -- Historial y vigencia
  fecha_vigencia DATE NOT NULL DEFAULT CURRENT_DATE,
  es_configuracion_actual BOOLEAN DEFAULT true,

  -- Metadata
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- 2. ÍNDICES
-- =====================================================
CREATE INDEX idx_config_corte_producto ON configuraciones_corte(producto_id);
CREATE INDEX idx_config_corte_variante ON configuraciones_corte(variante_id);
CREATE INDEX idx_config_corte_fecha ON configuraciones_corte(fecha_vigencia);
CREATE INDEX idx_config_corte_actual ON configuraciones_corte(es_configuracion_actual);

-- =====================================================
-- 3. FUNCIÓN PARA CALCULAR TOTALES
-- =====================================================
CREATE OR REPLACE FUNCTION calcular_configuracion_corte()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular metros lineales totales
  NEW.total_metros_lineales := (
    CASE WHEN NEW.incluye_sabana_plana THEN COALESCE(NEW.metros_sabana_plana, 0) ELSE 0 END +
    CASE WHEN NEW.incluye_sabana_cajon THEN COALESCE(NEW.metros_sabana_cajon, 0) ELSE 0 END +
    CASE WHEN NEW.incluye_fundas THEN COALESCE(NEW.metros_fundas, 0) * COALESCE(NEW.cantidad_fundas, 1) ELSE 0 END
  ) * (1 + COALESCE(NEW.porcentaje_desperdicio, 0) / 100);

  -- Calcular costo de material
  NEW.costo_material := NEW.total_metros_lineales * COALESCE(NEW.precio_tela_metro, 0);

  -- Calcular costo total
  NEW.costo_total := COALESCE(NEW.costo_material, 0) +
                     COALESCE(NEW.costo_confeccion, 0) +
                     COALESCE(NEW.costo_empaque, 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calcular_corte ON configuraciones_corte;
CREATE TRIGGER trigger_calcular_corte
  BEFORE INSERT OR UPDATE ON configuraciones_corte
  FOR EACH ROW EXECUTE FUNCTION calcular_configuracion_corte();

-- =====================================================
-- 4. FUNCIÓN PARA DESACTIVAR CONFIGURACIONES ANTERIORES
-- =====================================================
CREATE OR REPLACE FUNCTION desactivar_config_anteriores()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.es_configuracion_actual = true THEN
    UPDATE configuraciones_corte
    SET es_configuracion_actual = false
    WHERE producto_id = NEW.producto_id
      AND (variante_id = NEW.variante_id OR (variante_id IS NULL AND NEW.variante_id IS NULL))
      AND id != NEW.id
      AND es_configuracion_actual = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_desactivar_config ON configuraciones_corte;
CREATE TRIGGER trigger_desactivar_config
  AFTER INSERT OR UPDATE ON configuraciones_corte
  FOR EACH ROW EXECUTE FUNCTION desactivar_config_anteriores();

-- =====================================================
-- 5. TRIGGER PARA UPDATED_AT
-- =====================================================
DROP TRIGGER IF EXISTS update_config_corte_updated_at ON configuraciones_corte;
CREATE TRIGGER update_config_corte_updated_at
  BEFORE UPDATE ON configuraciones_corte
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE configuraciones_corte ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ConfigCorte: lectura para autenticados" ON configuraciones_corte;
DROP POLICY IF EXISTS "ConfigCorte: escritura para admin" ON configuraciones_corte;

CREATE POLICY "ConfigCorte: lectura para autenticados" ON configuraciones_corte
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "ConfigCorte: escritura para admin" ON configuraciones_corte
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- =====================================================
-- 7. VISTA HISTORIAL DE PRECIOS
-- =====================================================
CREATE OR REPLACE VIEW historial_precios_corte AS
SELECT
  cc.id,
  cc.producto_id,
  p.linea_nombre as producto_nombre,
  cc.variante_id,
  v.material,
  v.color,
  v.talla,
  cc.nombre as configuracion,
  cc.fecha_vigencia,
  cc.precio_tela_metro,
  cc.total_metros_lineales,
  cc.costo_material,
  cc.costo_confeccion,
  cc.costo_empaque,
  cc.costo_total,
  cc.es_configuracion_actual,
  cc.created_at
FROM configuraciones_corte cc
JOIN productos p ON p.id = cc.producto_id
LEFT JOIN variantes_producto v ON v.id = cc.variante_id
WHERE cc.activo = true
ORDER BY cc.producto_id, cc.fecha_vigencia DESC;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- SELECT * FROM configuraciones_corte;
-- SELECT * FROM historial_precios_corte;

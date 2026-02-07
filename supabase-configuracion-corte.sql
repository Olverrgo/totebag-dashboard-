-- =====================================================
-- CONFIGURACIÓN DE CORTE - Blancos Sinai
-- Sistema de cálculo de costos con historial de precios
-- =====================================================

-- =====================================================
-- 1. TABLA CONFIGURACIONES_CORTE
-- =====================================================
CREATE TABLE IF NOT EXISTS configuraciones_corte (
  id SERIAL PRIMARY KEY,

  -- Relaciones
  producto_id INTEGER REFERENCES productos(id) ON DELETE CASCADE,
  variante_id INTEGER REFERENCES variantes_producto(id) ON DELETE SET NULL,

  -- Nombre descriptivo
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,

  -- Dimensiones Sábana Plana (cm)
  sabana_plana_largo DECIMAL(10,2) DEFAULT 0,
  sabana_plana_ancho DECIMAL(10,2) DEFAULT 0,
  incluye_sabana_plana BOOLEAN DEFAULT true,

  -- Dimensiones Sábana de Cajón/Ajustable (cm)
  sabana_cajon_largo DECIMAL(10,2) DEFAULT 0,
  sabana_cajon_ancho DECIMAL(10,2) DEFAULT 0,
  sabana_cajon_alto DECIMAL(10,2) DEFAULT 0, -- Profundidad del cajón
  incluye_sabana_cajon BOOLEAN DEFAULT true,

  -- Dimensiones Fundas (cm)
  funda_largo DECIMAL(10,2) DEFAULT 0,
  funda_ancho DECIMAL(10,2) DEFAULT 0,
  cantidad_fundas INTEGER DEFAULT 2,
  incluye_fundas BOOLEAN DEFAULT true,

  -- Piezas adicionales (JSON para flexibilidad)
  piezas_adicionales JSONB DEFAULT '[]',
  -- Ejemplo: [{"nombre": "Cojín decorativo", "largo": 40, "ancho": 40, "cantidad": 2}]

  -- Configuración de tela
  ancho_tela DECIMAL(10,2) DEFAULT 150, -- Ancho del rollo de tela en cm
  porcentaje_desperdicio DECIMAL(5,2) DEFAULT 10, -- % de desperdicio/merma

  -- Cálculos (se actualizan con trigger)
  metros_sabana_plana DECIMAL(10,3) GENERATED ALWAYS AS (
    CASE WHEN incluye_sabana_plana THEN
      (sabana_plana_largo * sabana_plana_ancho) / 10000
    ELSE 0 END
  ) STORED,
  metros_sabana_cajon DECIMAL(10,3) GENERATED ALWAYS AS (
    CASE WHEN incluye_sabana_cajon THEN
      ((sabana_cajon_largo + 2 * sabana_cajon_alto) * (sabana_cajon_ancho + 2 * sabana_cajon_alto)) / 10000
    ELSE 0 END
  ) STORED,
  metros_fundas DECIMAL(10,3) GENERATED ALWAYS AS (
    CASE WHEN incluye_fundas THEN
      (funda_largo * funda_ancho * cantidad_fundas * 2) / 10000 -- x2 porque tienen 2 caras
    ELSE 0 END
  ) STORED,

  -- Total metros cuadrados (sin desperdicio)
  total_metros_cuadrados DECIMAL(10,3),

  -- Metros lineales (considerando ancho de tela y desperdicio)
  total_metros_lineales DECIMAL(10,3),

  -- Precio y costo
  precio_tela_metro DECIMAL(10,2) NOT NULL DEFAULT 0,
  costo_material DECIMAL(10,2),

  -- Costos adicionales
  costo_confeccion DECIMAL(10,2) DEFAULT 0,
  costo_empaque DECIMAL(10,2) DEFAULT 0,
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
CREATE INDEX IF NOT EXISTS idx_config_corte_producto ON configuraciones_corte(producto_id);
CREATE INDEX IF NOT EXISTS idx_config_corte_variante ON configuraciones_corte(variante_id);
CREATE INDEX IF NOT EXISTS idx_config_corte_fecha ON configuraciones_corte(fecha_vigencia);
CREATE INDEX IF NOT EXISTS idx_config_corte_actual ON configuraciones_corte(es_configuracion_actual);
CREATE INDEX IF NOT EXISTS idx_config_corte_activo ON configuraciones_corte(activo);

-- =====================================================
-- 3. FUNCIÓN PARA CALCULAR TOTALES
-- =====================================================
CREATE OR REPLACE FUNCTION calcular_configuracion_corte()
RETURNS TRIGGER AS $$
DECLARE
  metros_adicionales DECIMAL(10,3) := 0;
  pieza JSONB;
BEGIN
  -- Calcular metros de piezas adicionales
  IF NEW.piezas_adicionales IS NOT NULL AND jsonb_array_length(NEW.piezas_adicionales) > 0 THEN
    FOR pieza IN SELECT * FROM jsonb_array_elements(NEW.piezas_adicionales)
    LOOP
      metros_adicionales := metros_adicionales +
        (COALESCE((pieza->>'largo')::DECIMAL, 0) *
         COALESCE((pieza->>'ancho')::DECIMAL, 0) *
         COALESCE((pieza->>'cantidad')::INTEGER, 1)) / 10000;
    END LOOP;
  END IF;

  -- Total metros cuadrados
  NEW.total_metros_cuadrados :=
    COALESCE(NEW.metros_sabana_plana, 0) +
    COALESCE(NEW.metros_sabana_cajon, 0) +
    COALESCE(NEW.metros_fundas, 0) +
    metros_adicionales;

  -- Convertir a metros lineales (considerando ancho de tela y desperdicio)
  IF NEW.ancho_tela > 0 THEN
    NEW.total_metros_lineales :=
      (NEW.total_metros_cuadrados / (NEW.ancho_tela / 100)) *
      (1 + COALESCE(NEW.porcentaje_desperdicio, 0) / 100);
  ELSE
    NEW.total_metros_lineales := 0;
  END IF;

  -- Calcular costo de material
  NEW.costo_material := NEW.total_metros_lineales * COALESCE(NEW.precio_tela_metro, 0);

  -- Calcular costo total
  NEW.costo_total :=
    COALESCE(NEW.costo_material, 0) +
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
  -- Si esta es la configuración actual, desactivar las anteriores del mismo producto/variante
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

-- Eliminar políticas existentes si existen
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
-- 8. FUNCIÓN PARA ANÁLISIS DE VARIACIÓN DE PRECIOS
-- =====================================================
CREATE OR REPLACE FUNCTION analizar_variacion_precios(
  p_producto_id INTEGER,
  p_fecha_inicio DATE DEFAULT NULL,
  p_fecha_fin DATE DEFAULT NULL
)
RETURNS TABLE (
  fecha_vigencia DATE,
  precio_tela_metro DECIMAL,
  costo_material DECIMAL,
  costo_total DECIMAL,
  variacion_precio_pct DECIMAL,
  variacion_costo_pct DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH precios_ordenados AS (
    SELECT
      cc.fecha_vigencia,
      cc.precio_tela_metro,
      cc.costo_material,
      cc.costo_total,
      LAG(cc.precio_tela_metro) OVER (ORDER BY cc.fecha_vigencia) as precio_anterior,
      LAG(cc.costo_total) OVER (ORDER BY cc.fecha_vigencia) as costo_anterior
    FROM configuraciones_corte cc
    WHERE cc.producto_id = p_producto_id
      AND cc.activo = true
      AND (p_fecha_inicio IS NULL OR cc.fecha_vigencia >= p_fecha_inicio)
      AND (p_fecha_fin IS NULL OR cc.fecha_vigencia <= p_fecha_fin)
    ORDER BY cc.fecha_vigencia
  )
  SELECT
    po.fecha_vigencia,
    po.precio_tela_metro,
    po.costo_material,
    po.costo_total,
    CASE WHEN po.precio_anterior > 0 THEN
      ROUND(((po.precio_tela_metro - po.precio_anterior) / po.precio_anterior * 100)::DECIMAL, 2)
    ELSE 0 END as variacion_precio_pct,
    CASE WHEN po.costo_anterior > 0 THEN
      ROUND(((po.costo_total - po.costo_anterior) / po.costo_anterior * 100)::DECIMAL, 2)
    ELSE 0 END as variacion_costo_pct
  FROM precios_ordenados po;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- SELECT * FROM configuraciones_corte;
-- SELECT * FROM historial_precios_corte;
-- SELECT * FROM analizar_variacion_precios(1);

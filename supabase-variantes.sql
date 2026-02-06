-- =====================================================
-- VARIANTES DE PRODUCTO - Blancos Sinai
-- Sistema de SKUs con material, color, talla y stock
-- =====================================================

-- =====================================================
-- 1. TABLA VARIANTES_PRODUCTO
-- =====================================================
CREATE TABLE IF NOT EXISTS variantes_producto (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,

  -- Identificador único
  sku VARCHAR(50) UNIQUE,

  -- Atributos de la variante
  material VARCHAR(100),
  color VARCHAR(50),
  talla VARCHAR(50),

  -- Atributos adicionales (flexible)
  atributos JSONB DEFAULT '{}',

  -- Stock
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  stock_consignacion INTEGER DEFAULT 0 CHECK (stock_consignacion >= 0),
  stock_minimo INTEGER DEFAULT 0,

  -- Precios y costos
  costo_unitario DECIMAL(10,2) DEFAULT 0,
  precio_venta DECIMAL(10,2) DEFAULT 0,

  -- Metadata
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_variantes_producto ON variantes_producto(producto_id);
CREATE INDEX IF NOT EXISTS idx_variantes_sku ON variantes_producto(sku);
CREATE INDEX IF NOT EXISTS idx_variantes_material ON variantes_producto(material);
CREATE INDEX IF NOT EXISTS idx_variantes_color ON variantes_producto(color);
CREATE INDEX IF NOT EXISTS idx_variantes_activo ON variantes_producto(activo);
CREATE INDEX IF NOT EXISTS idx_variantes_stock ON variantes_producto(stock);

-- Índice compuesto para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_variantes_producto_activo ON variantes_producto(producto_id, activo);

-- =====================================================
-- 3. TRIGGER PARA UPDATED_AT
-- =====================================================
DROP TRIGGER IF EXISTS update_variantes_updated_at ON variantes_producto;
CREATE TRIGGER update_variantes_updated_at
  BEFORE UPDATE ON variantes_producto
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. FUNCIÓN PARA GENERAR SKU AUTOMÁTICO
-- =====================================================
CREATE OR REPLACE FUNCTION generar_sku_variante()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sku IS NULL OR NEW.sku = '' THEN
    NEW.sku := 'VAR-' || NEW.producto_id || '-' ||
               COALESCE(SUBSTRING(NEW.material, 1, 3), 'XXX') || '-' ||
               COALESCE(SUBSTRING(NEW.color, 1, 3), 'XXX') || '-' ||
               COALESCE(SUBSTRING(NEW.talla, 1, 3), 'XXX') || '-' ||
               LPAD(nextval('variantes_producto_id_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generar_sku ON variantes_producto;
CREATE TRIGGER trigger_generar_sku
  BEFORE INSERT ON variantes_producto
  FOR EACH ROW EXECUTE FUNCTION generar_sku_variante();

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE variantes_producto ENABLE ROW LEVEL SECURITY;

-- Lectura para usuarios autenticados
CREATE POLICY "Variantes: lectura para autenticados" ON variantes_producto
  FOR SELECT USING (auth.role() = 'authenticated');

-- Escritura solo para admin
CREATE POLICY "Variantes: escritura para admin" ON variantes_producto
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- =====================================================
-- 6. AGREGAR variante_id A TABLAS RELACIONADAS
-- =====================================================
-- Agregar referencia a variante en movimientos_stock
ALTER TABLE movimientos_stock
ADD COLUMN IF NOT EXISTS variante_id INTEGER REFERENCES variantes_producto(id);

-- Agregar referencia a variante en ventas
ALTER TABLE ventas
ADD COLUMN IF NOT EXISTS variante_id INTEGER REFERENCES variantes_producto(id),
ADD COLUMN IF NOT EXISTS variante_sku VARCHAR(50),
ADD COLUMN IF NOT EXISTS variante_detalle VARCHAR(200);

-- Índices para las nuevas columnas
CREATE INDEX IF NOT EXISTS idx_movimientos_variante ON movimientos_stock(variante_id);
CREATE INDEX IF NOT EXISTS idx_ventas_variante ON ventas(variante_id);

-- =====================================================
-- 7. VISTA RESUMEN DE VARIANTES POR PRODUCTO
-- =====================================================
CREATE OR REPLACE VIEW resumen_variantes AS
SELECT
  p.id as producto_id,
  p.linea_nombre as producto_nombre,
  COUNT(v.id) as total_variantes,
  SUM(v.stock) as stock_total,
  SUM(v.stock_consignacion) as consignacion_total,
  SUM(v.stock + v.stock_consignacion) as inventario_total,
  ARRAY_AGG(DISTINCT v.material) FILTER (WHERE v.material IS NOT NULL) as materiales,
  ARRAY_AGG(DISTINCT v.color) FILTER (WHERE v.color IS NOT NULL) as colores,
  ARRAY_AGG(DISTINCT v.talla) FILTER (WHERE v.talla IS NOT NULL) as tallas
FROM productos p
LEFT JOIN variantes_producto v ON v.producto_id = p.id AND v.activo = true
WHERE p.activo = true
GROUP BY p.id, p.linea_nombre;

-- =====================================================
-- 8. FUNCIÓN PARA OBTENER STOCK TOTAL DE PRODUCTO
-- =====================================================
CREATE OR REPLACE FUNCTION obtener_stock_producto(p_producto_id INTEGER)
RETURNS TABLE (
  stock_taller INTEGER,
  stock_consignacion INTEGER,
  stock_total INTEGER,
  num_variantes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(v.stock), 0)::INTEGER as stock_taller,
    COALESCE(SUM(v.stock_consignacion), 0)::INTEGER as stock_consignacion,
    COALESCE(SUM(v.stock + v.stock_consignacion), 0)::INTEGER as stock_total,
    COUNT(v.id)::INTEGER as num_variantes
  FROM variantes_producto v
  WHERE v.producto_id = p_producto_id
    AND v.activo = true;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- SELECT * FROM variantes_producto;
-- SELECT * FROM resumen_variantes;
-- SELECT * FROM obtener_stock_producto(1);

-- =====================================================
-- CATEGORÍAS JERÁRQUICAS Y CAMPOS DINÁMICOS
-- Blancos Sinai - Sistema de Productos
-- =====================================================

-- =====================================================
-- 1. TABLA CATEGORIAS (Totebags, Ropa de Cama, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  icono VARCHAR(10) DEFAULT '📦',
  descripcion TEXT,
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para categorías
CREATE INDEX IF NOT EXISTS idx_categorias_slug ON categorias(slug);
CREATE INDEX IF NOT EXISTS idx_categorias_orden ON categorias(orden);
CREATE INDEX IF NOT EXISTS idx_categorias_activo ON categorias(activo);

-- =====================================================
-- 2. TABLA SUBCATEGORIAS (Adulto, Infantil, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS subcategorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  descripcion TEXT,
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(categoria_id, slug)
);

-- Índices para subcategorías
CREATE INDEX IF NOT EXISTS idx_subcategorias_categoria ON subcategorias(categoria_id);
CREATE INDEX IF NOT EXISTS idx_subcategorias_slug ON subcategorias(slug);
CREATE INDEX IF NOT EXISTS idx_subcategorias_activo ON subcategorias(activo);

-- =====================================================
-- 3. TABLA CAMPOS_CATEGORIA (Campos dinámicos por categoría)
-- =====================================================
CREATE TABLE IF NOT EXISTS campos_categoria (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
  nombre_campo VARCHAR(50) NOT NULL,
  nombre_display VARCHAR(100) NOT NULL,
  tipo_campo VARCHAR(20) NOT NULL CHECK (tipo_campo IN ('text', 'number', 'decimal', 'select', 'boolean', 'textarea')),
  opciones JSONB DEFAULT NULL, -- Para tipo select: ["opcion1", "opcion2"]
  seccion VARCHAR(50) DEFAULT 'general' CHECK (seccion IN ('general', 'produccion', 'costos', 'medidas', 'caracteristicas')),
  es_requerido BOOLEAN DEFAULT false,
  valor_default TEXT,
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(categoria_id, nombre_campo)
);

-- Índices para campos_categoria
CREATE INDEX IF NOT EXISTS idx_campos_categoria_cat ON campos_categoria(categoria_id);
CREATE INDEX IF NOT EXISTS idx_campos_categoria_seccion ON campos_categoria(seccion);
CREATE INDEX IF NOT EXISTS idx_campos_categoria_activo ON campos_categoria(activo);

-- =====================================================
-- 4. MODIFICAR TABLA PRODUCTOS (agregar columnas)
-- =====================================================
-- Agregar columnas para categorías y campos dinámicos
ALTER TABLE productos
ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES categorias(id),
ADD COLUMN IF NOT EXISTS subcategoria_id UUID REFERENCES subcategorias(id),
ADD COLUMN IF NOT EXISTS campos_dinamicos JSONB DEFAULT '{}';

-- Índices para productos
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_subcategoria ON productos(subcategoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_campos_dinamicos ON productos USING GIN(campos_dinamicos);

-- =====================================================
-- 5. DATOS INICIALES - CATEGORÍAS
-- =====================================================
INSERT INTO categorias (nombre, slug, icono, descripcion, orden) VALUES
  ('Totebags', 'totebags', '🛍️', 'Bolsas de tela reutilizables, publicitarias y ecológicas', 1),
  ('Ropa de Cama', 'ropa-de-cama', '🛏️', 'Sábanas, cobertores, fundas y accesorios de cama', 2)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 6. DATOS INICIALES - SUBCATEGORÍAS
-- =====================================================
-- Subcategorías para Ropa de Cama
INSERT INTO subcategorias (categoria_id, nombre, slug, descripcion, orden)
SELECT
  c.id,
  sub.nombre,
  sub.slug,
  sub.descripcion,
  sub.orden
FROM categorias c
CROSS JOIN (
  VALUES
    ('Adulto', 'adulto', 'Ropa de cama para adultos en tallas matrimonial, queen y king', 1),
    ('Infantil', 'infantil', 'Ropa de cama para niños con diseños y tallas especiales', 2)
) AS sub(nombre, slug, descripcion, orden)
WHERE c.slug = 'ropa-de-cama'
ON CONFLICT (categoria_id, slug) DO NOTHING;

-- =====================================================
-- 7. DATOS INICIALES - CAMPOS PARA ROPA DE CAMA
-- =====================================================
INSERT INTO campos_categoria (categoria_id, nombre_campo, nombre_display, tipo_campo, opciones, seccion, es_requerido, orden)
SELECT
  c.id,
  campo.nombre_campo,
  campo.nombre_display,
  campo.tipo_campo,
  campo.opciones::JSONB,
  campo.seccion,
  campo.es_requerido,
  campo.orden
FROM categorias c
CROSS JOIN (
  VALUES
    -- Sección Medidas
    ('talla_cama', 'Talla de Cama', 'select', '["Individual", "Matrimonial", "Queen", "King"]', 'medidas', true, 1),
    ('dimensiones_largo', 'Largo (cm)', 'number', NULL, 'medidas', false, 2),
    ('dimensiones_ancho', 'Ancho (cm)', 'number', NULL, 'medidas', false, 3),

    -- Sección Características
    ('composicion', 'Composición', 'text', NULL, 'caracteristicas', false, 4),
    ('hilos', 'Conteo de Hilos', 'number', NULL, 'caracteristicas', false, 5),
    ('incluye_sabana_ajustable', 'Incluye Sábana Ajustable', 'boolean', NULL, 'caracteristicas', false, 6),
    ('incluye_fundas', 'Incluye Fundas', 'boolean', NULL, 'caracteristicas', false, 7),
    ('cantidad_fundas', 'Cantidad de Fundas', 'number', NULL, 'caracteristicas', false, 8),

    -- Sección Costos
    ('costo_material', 'Costo de Material', 'decimal', NULL, 'costos', true, 9),
    ('costo_confeccion', 'Costo de Confección', 'decimal', NULL, 'costos', true, 10),
    ('costo_empaque', 'Costo de Empaque', 'decimal', NULL, 'costos', false, 11)
) AS campo(nombre_campo, nombre_display, tipo_campo, opciones, seccion, es_requerido, orden)
WHERE c.slug = 'ropa-de-cama'
ON CONFLICT (categoria_id, nombre_campo) DO NOTHING;

-- =====================================================
-- 8. MIGRAR PRODUCTOS EXISTENTES A CATEGORÍA TOTEBAGS
-- =====================================================
-- Actualizar productos existentes para asociarlos a Totebags
UPDATE productos
SET categoria_id = (SELECT id FROM categorias WHERE slug = 'totebags')
WHERE categoria_id IS NULL;

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Habilitar RLS en las nuevas tablas
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE campos_categoria ENABLE ROW LEVEL SECURITY;

-- Políticas para CATEGORIAS (lectura pública, escritura admin)
CREATE POLICY "Categorias: lectura para todos" ON categorias
  FOR SELECT USING (true);

CREATE POLICY "Categorias: escritura para admin" ON categorias
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Políticas para SUBCATEGORIAS (lectura pública, escritura admin)
CREATE POLICY "Subcategorias: lectura para todos" ON subcategorias
  FOR SELECT USING (true);

CREATE POLICY "Subcategorias: escritura para admin" ON subcategorias
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Políticas para CAMPOS_CATEGORIA (lectura pública, escritura admin)
CREATE POLICY "CamposCategoria: lectura para todos" ON campos_categoria
  FOR SELECT USING (true);

CREATE POLICY "CamposCategoria: escritura para admin" ON campos_categoria
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- =====================================================
-- 10. FUNCIÓN PARA OBTENER CAMPOS DE CATEGORÍA
-- =====================================================
CREATE OR REPLACE FUNCTION obtener_campos_categoria(p_categoria_id UUID)
RETURNS TABLE (
  id UUID,
  nombre_campo VARCHAR(50),
  nombre_display VARCHAR(100),
  tipo_campo VARCHAR(20),
  opciones JSONB,
  seccion VARCHAR(50),
  es_requerido BOOLEAN,
  valor_default TEXT,
  orden INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cc.id,
    cc.nombre_campo,
    cc.nombre_display,
    cc.tipo_campo,
    cc.opciones,
    cc.seccion,
    cc.es_requerido,
    cc.valor_default,
    cc.orden
  FROM campos_categoria cc
  WHERE cc.categoria_id = p_categoria_id
    AND cc.activo = true
  ORDER BY cc.seccion, cc.orden;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 11. TRIGGER PARA UPDATED_AT
-- =====================================================
-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para las nuevas tablas
DROP TRIGGER IF EXISTS update_categorias_updated_at ON categorias;
CREATE TRIGGER update_categorias_updated_at
  BEFORE UPDATE ON categorias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subcategorias_updated_at ON subcategorias;
CREATE TRIGGER update_subcategorias_updated_at
  BEFORE UPDATE ON subcategorias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_campos_categoria_updated_at ON campos_categoria;
CREATE TRIGGER update_campos_categoria_updated_at
  BEFORE UPDATE ON campos_categoria
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Ejecutar para verificar la instalación:
-- SELECT * FROM categorias;
-- SELECT * FROM subcategorias;
-- SELECT * FROM campos_categoria WHERE categoria_id = (SELECT id FROM categorias WHERE slug = 'ropa-de-cama');

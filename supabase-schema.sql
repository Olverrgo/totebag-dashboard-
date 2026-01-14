-- =====================================================
-- ESQUEMA DE BASE DE DATOS - BLANCOS SINAI TOTEBAG
-- =====================================================
-- Ejecutar este SQL en: Supabase > SQL Editor > New Query
-- =====================================================

-- Tabla principal de modelos
CREATE TABLE modelos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  linea VARCHAR(50) NOT NULL, -- publicitaria, eco, ecoForro, basica, estandar, premium
  nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(100), -- Tipo de diseño
  descripcion TEXT,
  estado VARCHAR(20) DEFAULT 'desarrollo', -- activo, desarrollo, pausado
  stock_actual INTEGER DEFAULT 0,
  precio_sugerido DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de imágenes de modelos
CREATE TABLE modelo_imagenes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  modelo_id UUID REFERENCES modelos(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  nombre VARCHAR(255),
  es_principal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de PDFs de modelos (fichas técnicas, patrones, etc.)
CREATE TABLE modelo_pdfs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  modelo_id UUID REFERENCES modelos(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  nombre VARCHAR(255),
  tipo VARCHAR(50), -- ficha_tecnica, patron, otro
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de comentarios
CREATE TABLE modelo_comentarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  modelo_id UUID REFERENCES modelos(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  autor VARCHAR(100) DEFAULT 'Admin'
);

-- Tabla de movimientos de stock
CREATE TABLE modelo_stock (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  modelo_id UUID REFERENCES modelos(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL,
  tipo VARCHAR(20) NOT NULL, -- entrada, salida
  nota TEXT,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX idx_modelos_linea ON modelos(linea);
CREATE INDEX idx_modelos_estado ON modelos(estado);
CREATE INDEX idx_modelo_imagenes_modelo ON modelo_imagenes(modelo_id);
CREATE INDEX idx_modelo_pdfs_modelo ON modelo_pdfs(modelo_id);
CREATE INDEX idx_modelo_comentarios_modelo ON modelo_comentarios(modelo_id);
CREATE INDEX idx_modelo_stock_modelo ON modelo_stock(modelo_id);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_modelos_updated_at
  BEFORE UPDATE ON modelos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Función para calcular stock actual
CREATE OR REPLACE FUNCTION get_stock_actual(p_modelo_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_stock INTEGER;
BEGIN
  SELECT COALESCE(SUM(
    CASE WHEN tipo = 'entrada' THEN cantidad ELSE -cantidad END
  ), 0)
  INTO v_stock
  FROM modelo_stock
  WHERE modelo_id = p_modelo_id;

  RETURN v_stock;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CONFIGURACIÓN DE STORAGE (Buckets)
-- =====================================================
-- Ejecutar esto en SQL Editor también:

-- Crear bucket para imágenes
INSERT INTO storage.buckets (id, name, public)
VALUES ('modelo-imagenes', 'modelo-imagenes', true)
ON CONFLICT (id) DO NOTHING;

-- Crear bucket para PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('modelo-pdfs', 'modelo-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE modelo_imagenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE modelo_pdfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE modelo_comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE modelo_stock ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir acceso público (ajustar según necesidades)
CREATE POLICY "Permitir lectura pública de modelos" ON modelos
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserción de modelos" ON modelos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualización de modelos" ON modelos
  FOR UPDATE USING (true);

CREATE POLICY "Permitir eliminación de modelos" ON modelos
  FOR DELETE USING (true);

-- Repetir para otras tablas
CREATE POLICY "Permitir todo en modelo_imagenes" ON modelo_imagenes
  FOR ALL USING (true);

CREATE POLICY "Permitir todo en modelo_pdfs" ON modelo_pdfs
  FOR ALL USING (true);

CREATE POLICY "Permitir todo en modelo_comentarios" ON modelo_comentarios
  FOR ALL USING (true);

CREATE POLICY "Permitir todo en modelo_stock" ON modelo_stock
  FOR ALL USING (true);

-- Políticas de Storage
CREATE POLICY "Permitir subida de imágenes" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'modelo-imagenes');

CREATE POLICY "Permitir lectura de imágenes" ON storage.objects
  FOR SELECT USING (bucket_id = 'modelo-imagenes');

CREATE POLICY "Permitir eliminación de imágenes" ON storage.objects
  FOR DELETE USING (bucket_id = 'modelo-imagenes');

CREATE POLICY "Permitir subida de PDFs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'modelo-pdfs');

CREATE POLICY "Permitir lectura de PDFs" ON storage.objects
  FOR SELECT USING (bucket_id = 'modelo-pdfs');

CREATE POLICY "Permitir eliminación de PDFs" ON storage.objects
  FOR DELETE USING (bucket_id = 'modelo-pdfs');

-- =====================================================
-- DATOS DE EJEMPLO (Opcional)
-- =====================================================

-- Insertar algunos modelos de ejemplo
INSERT INTO modelos (linea, nombre, tipo, descripcion, estado, stock_actual) VALUES
  ('publicitaria', 'Corporativo Simple', 'Serigrafía 1 tinta', 'Logo empresa centrado', 'activo', 50),
  ('publicitaria', 'Evento Masivo', 'Serigrafía 2 tintas', 'Diseño para ferias y expos', 'desarrollo', 0),
  ('eco', 'Botanical Garden', 'Estampado floral', 'Hojas y flores tropicales', 'activo', 25),
  ('eco', 'Geometric Minimal', 'Geométrico', 'Líneas y formas simples', 'activo', 30),
  ('eco', 'Ocean Waves', 'Abstracto', 'Ondas en tonos azules', 'desarrollo', 0),
  ('ecoForro', 'Azteca Modern', 'Étnico', 'Patrones aztecas contemporáneos', 'activo', 15),
  ('ecoForro', 'Sunset Vibes', 'Degradado', 'Colores cálidos del atardecer', 'activo', 20),
  ('basica', 'Classic Stripes', 'Rayas', 'Rayas clásicas marineras', 'activo', 40),
  ('basica', 'Polka Dots', 'Lunares', 'Lunares vintage', 'activo', 35),
  ('estandar', 'Bohemian Dream', 'Boho', 'Estilo bohemio con mandalas', 'activo', 18),
  ('estandar', 'Urban Art', 'Street art', 'Graffiti y arte urbano', 'activo', 22),
  ('estandar', 'Nature Walk', 'Naturaleza', 'Bosques y montañas', 'activo', 28),
  ('premium', 'Artisan Craft', 'Artesanal', 'Bordado tradicional mexicano', 'activo', 10),
  ('premium', 'Luxury Marble', 'Mármol', 'Textura mármol elegante', 'activo', 12),
  ('premium', 'Gold Foliage', 'Botánico premium', 'Hojas con detalles dorados', 'activo', 8),
  ('premium', 'Talavera Classic', 'Talavera', 'Azulejo poblano tradicional', 'desarrollo', 0);

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
-- Una vez ejecutado, ve a Storage > modelo-imagenes y modelo-pdfs
-- y verifica que los buckets estén creados correctamente.
-- =====================================================

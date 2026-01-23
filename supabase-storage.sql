-- =====================================================
-- MIGRACION: Storage para imagenes y PDFs de productos
-- =====================================================
-- Ejecutar en: Supabase > SQL Editor > New Query
-- =====================================================

-- Agregar campos para URLs de archivos en productos
ALTER TABLE productos
ADD COLUMN IF NOT EXISTS imagen_url TEXT,
ADD COLUMN IF NOT EXISTS imagen_nombre TEXT,
ADD COLUMN IF NOT EXISTS pdf_patron_url TEXT,
ADD COLUMN IF NOT EXISTS pdf_patron_nombre TEXT,
ADD COLUMN IF NOT EXISTS pdf_instrucciones_url TEXT,
ADD COLUMN IF NOT EXISTS pdf_instrucciones_nombre TEXT;

-- =====================================================
-- CONFIGURAR STORAGE BUCKETS
-- =====================================================
-- IMPORTANTE: Los buckets se crean desde el panel de Supabase
-- Ve a: Storage > New Bucket
--
-- Bucket 1: producto-imagenes
--   - Public: SI (para mostrar imagenes)
--   - File size limit: 5MB
--   - Allowed MIME types: image/jpeg, image/png, image/webp
--
-- Bucket 2: producto-documentos
--   - Public: NO (documentos privados)
--   - File size limit: 10MB
--   - Allowed MIME types: application/pdf
-- =====================================================

-- Crear buckets via SQL (alternativa)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('producto-imagenes', 'producto-imagenes', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('producto-documentos', 'producto-documentos', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- POLITICAS DE STORAGE
-- =====================================================

-- Politicas para producto-imagenes (publico)
CREATE POLICY "Imagenes publicas para todos" ON storage.objects
  FOR SELECT USING (bucket_id = 'producto-imagenes');

CREATE POLICY "Usuarios autenticados pueden subir imagenes" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'producto-imagenes' AND auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden actualizar imagenes" ON storage.objects
  FOR UPDATE USING (bucket_id = 'producto-imagenes' AND auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden eliminar imagenes" ON storage.objects
  FOR DELETE USING (bucket_id = 'producto-imagenes' AND auth.role() = 'authenticated');

-- Politicas para producto-documentos (privado)
CREATE POLICY "Solo autenticados pueden ver documentos" ON storage.objects
  FOR SELECT USING (bucket_id = 'producto-documentos' AND auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden subir documentos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'producto-documentos' AND auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden actualizar documentos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'producto-documentos' AND auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden eliminar documentos" ON storage.objects
  FOR DELETE USING (bucket_id = 'producto-documentos' AND auth.role() = 'authenticated');

-- =====================================================
-- FIN DE LA MIGRACION
-- =====================================================

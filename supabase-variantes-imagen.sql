-- =====================================================
-- AGREGAR IMAGEN A VARIANTES - Blancos Sinai
-- =====================================================

-- 1. Agregar columna imagen_url a variantes_producto
ALTER TABLE variantes_producto
ADD COLUMN IF NOT EXISTS imagen_url TEXT;

-- 2. Crear bucket de storage para imágenes de variantes (si no existe)
-- NOTA: Esto se debe hacer desde el panel de Supabase > Storage > New Bucket
-- Nombre sugerido: "variantes-imagenes"
-- Configuración: Public bucket = true (para poder ver las imágenes)

-- 3. Política de storage (ejecutar en SQL o configurar en panel)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('variantes-imagenes', 'variantes-imagenes', true);

-- 4. Políticas de acceso para el bucket
-- Estas se deben configurar en Supabase Dashboard > Storage > variantes-imagenes > Policies:
-- - SELECT: Permitir a todos (public)
-- - INSERT: Solo usuarios autenticados
-- - UPDATE: Solo usuarios autenticados
-- - DELETE: Solo usuarios autenticados

-- Verificación
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'variantes_producto' AND column_name = 'imagen_url';

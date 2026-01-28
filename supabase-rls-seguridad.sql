-- =====================================================
-- MIGRACION: Correccion de politicas RLS de seguridad
-- =====================================================
-- Ejecutar en: Supabase > SQL Editor > New Query
-- IMPORTANTE: Ejecutar DESPUES de todos los demas scripts
-- =====================================================
-- CAMBIOS:
--   1. Lectura: de publica a solo usuarios autenticados
--   2. Escritura: de cualquier autenticado a solo admin
--   3. Agrega RLS a clientes y movimientos_stock
--   4. Storage: solo admin puede subir/eliminar archivos
-- =====================================================

-- =====================================================
-- FUNCION HELPER: Verificar si el usuario es admin
-- =====================================================
-- Usa la tabla user_profiles con columna 'rol'
-- (creada en supabase-auth.sql)

CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND rol = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- PASO 1: ELIMINAR POLITICAS PERMISIVAS EXISTENTES
-- =====================================================

-- lineas_producto
DROP POLICY IF EXISTS "Lectura pública lineas_producto" ON lineas_producto;
DROP POLICY IF EXISTS "Escritura autenticada lineas_producto" ON lineas_producto;

-- proyecciones
DROP POLICY IF EXISTS "Lectura pública proyecciones" ON proyecciones;
DROP POLICY IF EXISTS "Escritura autenticada proyecciones" ON proyecciones;

-- canales_ecommerce
DROP POLICY IF EXISTS "Lectura pública canales_ecommerce" ON canales_ecommerce;
DROP POLICY IF EXISTS "Escritura autenticada canales_ecommerce" ON canales_ecommerce;

-- costos_envio
DROP POLICY IF EXISTS "Lectura pública costos_envio" ON costos_envio;
DROP POLICY IF EXISTS "Escritura autenticada costos_envio" ON costos_envio;

-- personalizacion
DROP POLICY IF EXISTS "Lectura pública personalizacion" ON personalizacion;
DROP POLICY IF EXISTS "Escritura autenticada personalizacion" ON personalizacion;

-- tipos_diseno
DROP POLICY IF EXISTS "Lectura pública tipos_diseno" ON tipos_diseno;
DROP POLICY IF EXISTS "Escritura autenticada tipos_diseno" ON tipos_diseno;

-- colecciones
DROP POLICY IF EXISTS "Lectura pública colecciones" ON colecciones;
DROP POLICY IF EXISTS "Escritura autenticada colecciones" ON colecciones;

-- configuracion
DROP POLICY IF EXISTS "Lectura pública configuracion" ON configuracion;
DROP POLICY IF EXISTS "Escritura autenticada configuracion" ON configuracion;

-- tipos_tela
DROP POLICY IF EXISTS "Lectura pública tipos_tela" ON tipos_tela;
DROP POLICY IF EXISTS "Escritura autenticada tipos_tela" ON tipos_tela;

-- config_envio
DROP POLICY IF EXISTS "Lectura pública config_envio" ON config_envio;
DROP POLICY IF EXISTS "Escritura autenticada config_envio" ON config_envio;

-- productos
DROP POLICY IF EXISTS "Lectura pública productos" ON productos;
DROP POLICY IF EXISTS "Escritura autenticada productos" ON productos;

-- costos_amazon (ya tiene admin-only, pero limpiamos lectura)
DROP POLICY IF EXISTS "Usuarios autenticados pueden leer costos" ON costos_amazon;
DROP POLICY IF EXISTS "Solo admins pueden actualizar costos" ON costos_amazon;
DROP POLICY IF EXISTS "Solo admins pueden insertar costos" ON costos_amazon;

-- storage policies
DROP POLICY IF EXISTS "Imagenes publicas para todos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir imagenes" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar imagenes" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar imagenes" ON storage.objects;
DROP POLICY IF EXISTS "Solo autenticados pueden ver documentos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir documentos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar documentos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar documentos" ON storage.objects;

-- =====================================================
-- PASO 2: NUEVAS POLITICAS - LECTURA AUTENTICADA
-- =====================================================
-- Solo usuarios autenticados pueden leer datos del dashboard

CREATE POLICY "Lectura autenticada lineas_producto" ON lineas_producto
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Lectura autenticada proyecciones" ON proyecciones
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Lectura autenticada canales_ecommerce" ON canales_ecommerce
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Lectura autenticada costos_envio" ON costos_envio
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Lectura autenticada personalizacion" ON personalizacion
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Lectura autenticada tipos_diseno" ON tipos_diseno
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Lectura autenticada colecciones" ON colecciones
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Lectura autenticada configuracion" ON configuracion
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Lectura autenticada tipos_tela" ON tipos_tela
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Lectura autenticada config_envio" ON config_envio
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Lectura autenticada productos" ON productos
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Lectura autenticada costos_amazon" ON costos_amazon
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- =====================================================
-- PASO 3: NUEVAS POLITICAS - ESCRITURA SOLO ADMIN
-- =====================================================

-- lineas_producto
CREATE POLICY "Solo admin puede insertar lineas_producto" ON lineas_producto
  FOR INSERT WITH CHECK (public.es_admin());
CREATE POLICY "Solo admin puede actualizar lineas_producto" ON lineas_producto
  FOR UPDATE USING (public.es_admin());
CREATE POLICY "Solo admin puede eliminar lineas_producto" ON lineas_producto
  FOR DELETE USING (public.es_admin());

-- proyecciones
CREATE POLICY "Solo admin puede insertar proyecciones" ON proyecciones
  FOR INSERT WITH CHECK (public.es_admin());
CREATE POLICY "Solo admin puede actualizar proyecciones" ON proyecciones
  FOR UPDATE USING (public.es_admin());
CREATE POLICY "Solo admin puede eliminar proyecciones" ON proyecciones
  FOR DELETE USING (public.es_admin());

-- canales_ecommerce
CREATE POLICY "Solo admin puede insertar canales_ecommerce" ON canales_ecommerce
  FOR INSERT WITH CHECK (public.es_admin());
CREATE POLICY "Solo admin puede actualizar canales_ecommerce" ON canales_ecommerce
  FOR UPDATE USING (public.es_admin());
CREATE POLICY "Solo admin puede eliminar canales_ecommerce" ON canales_ecommerce
  FOR DELETE USING (public.es_admin());

-- costos_envio
CREATE POLICY "Solo admin puede insertar costos_envio" ON costos_envio
  FOR INSERT WITH CHECK (public.es_admin());
CREATE POLICY "Solo admin puede actualizar costos_envio" ON costos_envio
  FOR UPDATE USING (public.es_admin());
CREATE POLICY "Solo admin puede eliminar costos_envio" ON costos_envio
  FOR DELETE USING (public.es_admin());

-- personalizacion
CREATE POLICY "Solo admin puede insertar personalizacion" ON personalizacion
  FOR INSERT WITH CHECK (public.es_admin());
CREATE POLICY "Solo admin puede actualizar personalizacion" ON personalizacion
  FOR UPDATE USING (public.es_admin());
CREATE POLICY "Solo admin puede eliminar personalizacion" ON personalizacion
  FOR DELETE USING (public.es_admin());

-- tipos_diseno
CREATE POLICY "Solo admin puede insertar tipos_diseno" ON tipos_diseno
  FOR INSERT WITH CHECK (public.es_admin());
CREATE POLICY "Solo admin puede actualizar tipos_diseno" ON tipos_diseno
  FOR UPDATE USING (public.es_admin());
CREATE POLICY "Solo admin puede eliminar tipos_diseno" ON tipos_diseno
  FOR DELETE USING (public.es_admin());

-- colecciones
CREATE POLICY "Solo admin puede insertar colecciones" ON colecciones
  FOR INSERT WITH CHECK (public.es_admin());
CREATE POLICY "Solo admin puede actualizar colecciones" ON colecciones
  FOR UPDATE USING (public.es_admin());
CREATE POLICY "Solo admin puede eliminar colecciones" ON colecciones
  FOR DELETE USING (public.es_admin());

-- configuracion
CREATE POLICY "Solo admin puede insertar configuracion" ON configuracion
  FOR INSERT WITH CHECK (public.es_admin());
CREATE POLICY "Solo admin puede actualizar configuracion" ON configuracion
  FOR UPDATE USING (public.es_admin());
CREATE POLICY "Solo admin puede eliminar configuracion" ON configuracion
  FOR DELETE USING (public.es_admin());

-- tipos_tela
CREATE POLICY "Solo admin puede insertar tipos_tela" ON tipos_tela
  FOR INSERT WITH CHECK (public.es_admin());
CREATE POLICY "Solo admin puede actualizar tipos_tela" ON tipos_tela
  FOR UPDATE USING (public.es_admin());
CREATE POLICY "Solo admin puede eliminar tipos_tela" ON tipos_tela
  FOR DELETE USING (public.es_admin());

-- config_envio
CREATE POLICY "Solo admin puede insertar config_envio" ON config_envio
  FOR INSERT WITH CHECK (public.es_admin());
CREATE POLICY "Solo admin puede actualizar config_envio" ON config_envio
  FOR UPDATE USING (public.es_admin());
CREATE POLICY "Solo admin puede eliminar config_envio" ON config_envio
  FOR DELETE USING (public.es_admin());

-- productos
CREATE POLICY "Solo admin puede insertar productos" ON productos
  FOR INSERT WITH CHECK (public.es_admin());
CREATE POLICY "Solo admin puede actualizar productos" ON productos
  FOR UPDATE USING (public.es_admin());
CREATE POLICY "Solo admin puede eliminar productos" ON productos
  FOR DELETE USING (public.es_admin());

-- costos_amazon
CREATE POLICY "Solo admin puede insertar costos_amazon" ON costos_amazon
  FOR INSERT WITH CHECK (public.es_admin());
CREATE POLICY "Solo admin puede actualizar costos_amazon" ON costos_amazon
  FOR UPDATE USING (public.es_admin());
CREATE POLICY "Solo admin puede eliminar costos_amazon" ON costos_amazon
  FOR DELETE USING (public.es_admin());

-- =====================================================
-- PASO 4: RLS PARA CLIENTES Y MOVIMIENTOS_STOCK
-- =====================================================
-- Estas tablas fueron creadas sin politicas RLS

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_stock ENABLE ROW LEVEL SECURITY;

-- Lectura: todos los autenticados pueden ver
CREATE POLICY "Lectura autenticada clientes" ON clientes
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Lectura autenticada movimientos_stock" ON movimientos_stock
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Escritura: solo admin
CREATE POLICY "Solo admin puede insertar clientes" ON clientes
  FOR INSERT WITH CHECK (public.es_admin());
CREATE POLICY "Solo admin puede actualizar clientes" ON clientes
  FOR UPDATE USING (public.es_admin());
CREATE POLICY "Solo admin puede eliminar clientes" ON clientes
  FOR DELETE USING (public.es_admin());

CREATE POLICY "Solo admin puede insertar movimientos_stock" ON movimientos_stock
  FOR INSERT WITH CHECK (public.es_admin());
CREATE POLICY "Solo admin puede actualizar movimientos_stock" ON movimientos_stock
  FOR UPDATE USING (public.es_admin());
CREATE POLICY "Solo admin puede eliminar movimientos_stock" ON movimientos_stock
  FOR DELETE USING (public.es_admin());

-- =====================================================
-- PASO 5: STORAGE - SOLO ADMIN PUEDE MODIFICAR
-- =====================================================

-- Imagenes: autenticados pueden ver, solo admin puede subir/editar/eliminar
CREATE POLICY "Autenticados pueden ver imagenes" ON storage.objects
  FOR SELECT USING (bucket_id = 'producto-imagenes' AND auth.uid() IS NOT NULL);

CREATE POLICY "Solo admin puede subir imagenes" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'producto-imagenes' AND public.es_admin());

CREATE POLICY "Solo admin puede actualizar imagenes" ON storage.objects
  FOR UPDATE USING (bucket_id = 'producto-imagenes' AND public.es_admin());

CREATE POLICY "Solo admin puede eliminar imagenes" ON storage.objects
  FOR DELETE USING (bucket_id = 'producto-imagenes' AND public.es_admin());

-- Documentos: autenticados pueden ver, solo admin puede subir/editar/eliminar
CREATE POLICY "Autenticados pueden ver documentos" ON storage.objects
  FOR SELECT USING (bucket_id = 'producto-documentos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Solo admin puede subir documentos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'producto-documentos' AND public.es_admin());

CREATE POLICY "Solo admin puede actualizar documentos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'producto-documentos' AND public.es_admin());

CREATE POLICY "Solo admin puede eliminar documentos" ON storage.objects
  FOR DELETE USING (bucket_id = 'producto-documentos' AND public.es_admin());

-- =====================================================
-- FIN DE LA MIGRACION DE SEGURIDAD
-- =====================================================
-- RESUMEN DE CAMBIOS:
--   - 13 tablas: lectura solo autenticados
--   - 13 tablas: escritura solo admin (INSERT/UPDATE/DELETE)
--   - clientes y movimientos_stock: RLS habilitado
--   - Storage: solo admin puede subir/editar/eliminar
--   - Funcion es_admin() reutilizable
-- =====================================================

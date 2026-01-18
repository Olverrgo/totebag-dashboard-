-- =====================================================
-- ESQUEMA DE BASE DE DATOS - BLANCOS SINAI TOTEBAG
-- =====================================================
-- Versión 2.0 - Sin funcionalidad de modelos
-- Datos del dashboard migrados a BD
-- =====================================================
-- Ejecutar este SQL en: Supabase > SQL Editor > New Query
-- Para migración desde versión anterior, usar: supabase-migration.sql
-- =====================================================

-- =====================================================
-- TABLAS PRINCIPALES
-- =====================================================

-- 1. Perfiles de usuario (complementa auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255),
  role VARCHAR(20) DEFAULT 'viewer', -- admin, editor, viewer
  nombre VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Líneas de producto
CREATE TABLE IF NOT EXISTS lineas_producto (
  id VARCHAR(20) PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  icon VARCHAR(10),
  descripcion TEXT,
  material TEXT,
  especificaciones JSONB,
  costos JSONB,
  costo_total DECIMAL(10,2),
  precio_publico DECIMAL(10,2),
  precio_mayoreo DECIMAL(10,2),
  utilidad_publica DECIMAL(10,2),
  utilidad_mayoreo DECIMAL(10,2),
  margen_publico DECIMAL(10,2),
  margen_mayoreo DECIMAL(10,2),
  color VARCHAR(20),
  color_light VARCHAR(20),
  target TEXT,
  ventaja_especial TEXT,
  escenarios JSONB,
  volumenes JSONB,
  casos JSONB,
  promociones JSONB,
  personalizacion JSONB,
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Proyecciones mensuales
CREATE TABLE IF NOT EXISTS proyecciones (
  id SERIAL PRIMARY KEY,
  mes VARCHAR(20) NOT NULL,
  mes_numero INTEGER NOT NULL,
  ventas INTEGER DEFAULT 0,
  publicitaria INTEGER DEFAULT 0,
  eco INTEGER DEFAULT 0,
  eco_forro INTEGER DEFAULT 0,
  basica INTEGER DEFAULT 0,
  estandar INTEGER DEFAULT 0,
  premium INTEGER DEFAULT 0,
  ecomm INTEGER DEFAULT 0,
  directa INTEGER DEFAULT 0,
  mayoreo INTEGER DEFAULT 0,
  modelos INTEGER DEFAULT 0,
  utilidad DECIMAL(10,2) DEFAULT 0,
  acumulado DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Canales E-commerce
CREATE TABLE IF NOT EXISTS canales_ecommerce (
  id SERIAL PRIMARY KEY,
  canal VARCHAR(100) NOT NULL,
  precio DECIMAL(10,2),
  utilidad DECIMAL(10,2),
  margen DECIMAL(5,2),
  pros TEXT,
  contras TEXT,
  activo BOOLEAN DEFAULT true,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Costos de envío
CREATE TABLE IF NOT EXISTS costos_envio (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(20) NOT NULL,
  servicio VARCHAR(100) NOT NULL,
  tarifa DECIMAL(10,2),
  tiempo VARCHAR(50),
  nota TEXT,
  activo BOOLEAN DEFAULT true,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Opciones de personalización
CREATE TABLE IF NOT EXISTS personalizacion (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(100) NOT NULL,
  costo VARCHAR(50),
  minimo VARCHAR(20),
  ideal TEXT,
  activo BOOLEAN DEFAULT true,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tipos de diseño
CREATE TABLE IF NOT EXISTS tipos_diseno (
  id VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  icon VARCHAR(10),
  descripcion TEXT,
  popularidad INTEGER DEFAULT 0,
  temporada VARCHAR(100),
  target TEXT,
  ejemplos JSONB,
  colores JSONB,
  tendencia VARCHAR(20),
  activo BOOLEAN DEFAULT true,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Colecciones
CREATE TABLE IF NOT EXISTS colecciones (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  temporada VARCHAR(100),
  modelos_count INTEGER DEFAULT 0,
  disenos JSONB,
  lineas JSONB,
  estado VARCHAR(20) DEFAULT 'activa',
  ventas INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Configuración general
CREATE TABLE IF NOT EXISTS configuracion (
  clave VARCHAR(50) PRIMARY KEY,
  valor JSONB,
  descripcion TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_lineas_producto_activo ON lineas_producto(activo);
CREATE INDEX IF NOT EXISTS idx_lineas_producto_orden ON lineas_producto(orden);
CREATE INDEX IF NOT EXISTS idx_proyecciones_mes ON proyecciones(mes_numero);
CREATE INDEX IF NOT EXISTS idx_canales_ecommerce_activo ON canales_ecommerce(activo);
CREATE INDEX IF NOT EXISTS idx_costos_envio_tipo ON costos_envio(tipo);
CREATE INDEX IF NOT EXISTS idx_tipos_diseno_activo ON tipos_diseno(activo);
CREATE INDEX IF NOT EXISTS idx_colecciones_estado ON colecciones(estado);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_lineas_producto_updated_at ON lineas_producto;
CREATE TRIGGER update_lineas_producto_updated_at
  BEFORE UPDATE ON lineas_producto
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_proyecciones_updated_at ON proyecciones;
CREATE TRIGGER update_proyecciones_updated_at
  BEFORE UPDATE ON proyecciones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_canales_ecommerce_updated_at ON canales_ecommerce;
CREATE TRIGGER update_canales_ecommerce_updated_at
  BEFORE UPDATE ON canales_ecommerce
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_costos_envio_updated_at ON costos_envio;
CREATE TRIGGER update_costos_envio_updated_at
  BEFORE UPDATE ON costos_envio
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tipos_diseno_updated_at ON tipos_diseno;
CREATE TRIGGER update_tipos_diseno_updated_at
  BEFORE UPDATE ON tipos_diseno
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_colecciones_updated_at ON colecciones;
CREATE TRIGGER update_colecciones_updated_at
  BEFORE UPDATE ON colecciones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineas_producto ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyecciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE canales_ecommerce ENABLE ROW LEVEL SECURITY;
ALTER TABLE costos_envio ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalizacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_diseno ENABLE ROW LEVEL SECURITY;
ALTER TABLE colecciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

-- Políticas para user_profiles
CREATE POLICY "Usuarios pueden ver su propio perfil" ON user_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Políticas de lectura pública para datos del dashboard
CREATE POLICY "Lectura pública lineas_producto" ON lineas_producto FOR SELECT USING (true);
CREATE POLICY "Lectura pública proyecciones" ON proyecciones FOR SELECT USING (true);
CREATE POLICY "Lectura pública canales_ecommerce" ON canales_ecommerce FOR SELECT USING (true);
CREATE POLICY "Lectura pública costos_envio" ON costos_envio FOR SELECT USING (true);
CREATE POLICY "Lectura pública personalizacion" ON personalizacion FOR SELECT USING (true);
CREATE POLICY "Lectura pública tipos_diseno" ON tipos_diseno FOR SELECT USING (true);
CREATE POLICY "Lectura pública colecciones" ON colecciones FOR SELECT USING (true);
CREATE POLICY "Lectura pública configuracion" ON configuracion FOR SELECT USING (true);

-- Políticas de escritura (solo usuarios autenticados)
CREATE POLICY "Escritura autenticada lineas_producto" ON lineas_producto FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Escritura autenticada proyecciones" ON proyecciones FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Escritura autenticada canales_ecommerce" ON canales_ecommerce FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Escritura autenticada costos_envio" ON costos_envio FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Escritura autenticada personalizacion" ON personalizacion FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Escritura autenticada tipos_diseno" ON tipos_diseno FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Escritura autenticada colecciones" ON colecciones FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Escritura autenticada configuracion" ON configuracion FOR ALL USING (auth.uid() IS NOT NULL);

-- =====================================================
-- FUNCIÓN PARA CREAR PERFIL AL REGISTRAR USUARIO
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role)
  VALUES (new.id, new.email, 'viewer');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- FIN DEL ESQUEMA
-- =====================================================
-- Para insertar datos iniciales, ejecutar: supabase-migration.sql
-- =====================================================

-- =====================================================
-- ESQUEMA DE AUTENTICACIÓN - BLANCOS SINAI TOTEBAG
-- =====================================================
-- Ejecutar en: Supabase > SQL Editor > New Query
-- =====================================================

-- Tabla de perfiles de usuario (se conecta con auth.users de Supabase)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  nombre TEXT,
  rol TEXT NOT NULL DEFAULT 'usuario', -- 'admin' o 'usuario'
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_profiles_rol ON user_profiles(rol);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Habilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Usuarios pueden ver su propio perfil" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins pueden ver todos los perfiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "Admins pueden actualizar perfiles" ON user_profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- Función para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, nombre, rol)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'rol', 'usuario')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- CREAR USUARIO ADMINISTRADOR INICIAL
-- =====================================================
-- IMPORTANTE: Después de ejecutar este SQL, ve a:
-- Authentication > Users > Add User
-- Email: admin@blancossinai.com (o el que prefieras)
-- Password: (elige una contraseña segura)
--
-- Luego ejecuta este UPDATE para hacerlo admin:
-- UPDATE user_profiles SET rol = 'admin' WHERE email = 'admin@blancossinai.com';
-- =====================================================

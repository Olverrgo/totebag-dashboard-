-- =====================================================
-- MIGRACIÓN: Datos a BD y Eliminación de Modelos
-- =====================================================
-- INSTRUCCIONES: Ejecutar este SQL en Supabase > SQL Editor
-- =====================================================

-- =====================================================
-- PASO 1: ELIMINAR TABLAS DE MODELOS (si existen)
-- =====================================================

DROP TABLE IF EXISTS modelo_stock CASCADE;
DROP TABLE IF EXISTS modelo_comentarios CASCADE;
DROP TABLE IF EXISTS modelo_pdfs CASCADE;
DROP TABLE IF EXISTS modelo_imagenes CASCADE;
DROP TABLE IF EXISTS modelos CASCADE;

-- Eliminar buckets de storage de modelos (ejecutar manualmente en Storage)
-- DELETE FROM storage.buckets WHERE id IN ('modelo-imagenes', 'modelo-pdfs');

-- =====================================================
-- PASO 2: CREAR NUEVAS TABLAS
-- =====================================================

-- 1. Líneas de producto (reemplaza objeto 'productos')
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

-- 2. Proyecciones mensuales
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

-- 3. Canales E-commerce
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

-- 4. Costos de envío
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

-- 5. Opciones de personalización
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

-- 6. Tipos de diseño
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

-- 7. Colecciones
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

-- 8. Configuración general
CREATE TABLE IF NOT EXISTS configuracion (
  clave VARCHAR(50) PRIMARY KEY,
  valor JSONB,
  descripcion TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PASO 3: CREAR ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_lineas_producto_activo ON lineas_producto(activo);
CREATE INDEX IF NOT EXISTS idx_lineas_producto_orden ON lineas_producto(orden);
CREATE INDEX IF NOT EXISTS idx_proyecciones_mes ON proyecciones(mes_numero);
CREATE INDEX IF NOT EXISTS idx_canales_ecommerce_activo ON canales_ecommerce(activo);
CREATE INDEX IF NOT EXISTS idx_costos_envio_tipo ON costos_envio(tipo);
CREATE INDEX IF NOT EXISTS idx_tipos_diseno_activo ON tipos_diseno(activo);
CREATE INDEX IF NOT EXISTS idx_colecciones_estado ON colecciones(estado);

-- =====================================================
-- PASO 4: CREAR TRIGGERS PARA updated_at
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

-- =====================================================
-- PASO 5: HABILITAR RLS Y CREAR POLÍTICAS
-- =====================================================

ALTER TABLE lineas_producto ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyecciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE canales_ecommerce ENABLE ROW LEVEL SECURITY;
ALTER TABLE costos_envio ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalizacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_diseno ENABLE ROW LEVEL SECURITY;
ALTER TABLE colecciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública
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
-- PASO 6: INSERTAR DATOS INICIALES
-- =====================================================

-- Líneas de producto
INSERT INTO lineas_producto (id, nombre, icon, descripcion, material, especificaciones, costos, costo_total, precio_publico, precio_mayoreo, utilidad_publica, utilidad_mayoreo, margen_publico, margen_mayoreo, color, color_light, target, ventaja_especial, escenarios, volumenes, casos, promociones, personalizacion, orden) VALUES
('eco', 'ECO', '💎', 'Loneta 2.40m - 1 Bolsillo - Biodegradable', 'Loneta 100% Algodón (2.40m ancho)',
  '{"dimensiones": "35 x 40 cm", "exterior": "Loneta 2.40m ancho (2 bolsas/corte)", "forro": "Sin forro", "bolsillos": "1 bolsillo frontal", "acabado": "Costuras estéticas de calidad"}',
  '{"loneta": 17, "forro": 0, "maquila": 10, "insumos": 2, "merma": 1.45}',
  30, 80, 55, 50, 23, 167, 72, '#16A085', '#D5F5E3', 'Volumen masivo, eventos, gobierno, supermercados', 'Loneta 2.40m = 51% ahorro vs básica',
  '[{"nombre": "Conservador", "precio": 60, "pvp": 85, "volMin": 50}, {"nombre": "Equilibrado", "precio": 55, "pvp": 80, "volMin": 100, "recomendado": true}, {"nombre": "Agresivo", "precio": 50, "pvp": 75, "volMin": 200}, {"nombre": "Ultra-agresivo", "precio": 45, "pvp": 70, "volMin": 500}, {"nombre": "Volumen extremo", "precio": 40, "pvp": 60, "volMin": 1000}]',
  '[{"qty": 100, "descuento": 0, "tipo": "Mayorista inicial"}, {"qty": 200, "descuento": 0.05, "tipo": "Mayorista estándar"}, {"qty": 500, "descuento": 0.09, "tipo": "Mayorista frecuente"}, {"qty": 1000, "descuento": 0.14, "tipo": "Distribuidor"}, {"qty": 2000, "descuento": 0.18, "tipo": "Distribuidor grande"}, {"qty": 5000, "descuento": 0.22, "tipo": "Distribuidor Premium"}]',
  '[{"uso": "Eventos masivos", "volumen": "500-2000 pzas", "precio": "$45-50"}, {"uso": "Campañas gobierno", "volumen": "1000-5000 pzas", "precio": "$40-45"}, {"uso": "Supermercados", "volumen": "2000-10000 pzas", "precio": "$40-43"}, {"uso": "Empresas AAA", "volumen": "500-1000 pzas", "precio": "$50-55"}, {"uso": "Franquicias", "volumen": "1000+ pzas", "precio": "$45-50"}, {"uso": "Exportación", "volumen": "5000+ pzas", "precio": "$40-42"}]',
  '[{"nombre": "Promo 2x$139", "precioUnit": 69.5, "ahorro": "13%"}, {"nombre": "Promo 3x$199", "precioUnit": 66.33, "ahorro": "17%"}, {"nombre": "E-commerce $79", "precioUnit": 79, "ahorro": "1%"}]',
  null, 1),

('ecoForro', 'ECO+FORRO', '💠', 'Loneta 2.40m - Forro Manta - Mejor Acabado', 'Loneta 100% Algodón + Forro Manta',
  '{"dimensiones": "35 x 40 cm", "exterior": "Loneta 2.40m ancho (2 bolsas/corte)", "forro": "Manta económica (0.20m)", "bolsillos": "1 bolsillo frontal", "acabado": "Interior forrado, costuras ocultas"}',
  '{"loneta": 17, "forro": 5, "maquila": 12, "insumos": 2, "merma": 1.8}',
  38, 99, 65, 59, 25, 148, 63, '#1ABC9C', '#D1F2EB', 'Balance eco-calidad, cliente que busca mejor acabado', 'Forro por solo +$8 vs ECO básica',
  '[{"nombre": "Conservador", "precio": 70, "pvp": 105, "volMin": 50}, {"nombre": "Equilibrado", "precio": 65, "pvp": 99, "volMin": 100, "recomendado": true}, {"nombre": "Agresivo", "precio": 60, "pvp": 89, "volMin": 200}, {"nombre": "Ultra-agresivo", "precio": 55, "pvp": 79, "volMin": 500}]',
  '[{"qty": 100, "descuento": 0, "tipo": "Mayorista inicial"}, {"qty": 200, "descuento": 0.05, "tipo": "Mayorista estándar"}, {"qty": 500, "descuento": 0.08, "tipo": "Mayorista frecuente"}, {"qty": 1000, "descuento": 0.12, "tipo": "Distribuidor"}, {"qty": 2000, "descuento": 0.15, "tipo": "Distribuidor grande"}]',
  '[{"uso": "Eventos premium", "volumen": "200-500 pzas", "precio": "$60-65"}, {"uso": "Tiendas boutique", "volumen": "100-300 pzas", "precio": "$65"}, {"uso": "Regalos corporativos", "volumen": "300-1000 pzas", "precio": "$55-60"}, {"uso": "E-commerce nacional", "volumen": "100+ pzas", "precio": "$65"}]',
  '[{"nombre": "Promo 2x$179", "precioUnit": 89.5, "ahorro": "10%"}, {"nombre": "E-commerce $99", "precioUnit": 99, "ahorro": "0%"}, {"nombre": "Pack 3x$269", "precioUnit": 89.67, "ahorro": "9%"}]',
  null, 2),

('basica', 'BASICA', '🛍️', 'Solo Loneta - Sin Forro - Promocional', 'Loneta 100% Algodón',
  '{"dimensiones": "35 x 40 cm", "exterior": "Loneta 100% algodón estampada (0.50m)", "forro": "Sin forro", "bolsillos": "Sin bolsillos", "acabado": "Costuras reforzadas"}',
  '{"loneta": 34.5, "forro": 0, "maquila": 12, "insumos": 2, "merma": 2.5}',
  51, 120, 85, 69, 34, 135, 67, '#E67E22', '#FDEBD0', 'Volumen alto, eventos, promocionales', null,
  '[{"nombre": "Conservador", "precio": 95, "pvp": 130, "volMin": 30}, {"nombre": "Equilibrado", "precio": 85, "pvp": 120, "volMin": 50, "recomendado": true}, {"nombre": "Agresivo", "precio": 75, "pvp": 110, "volMin": 100}, {"nombre": "Ultra-agresivo", "precio": 70, "pvp": 100, "volMin": 200}, {"nombre": "Volumen extremo", "precio": 65, "pvp": 90, "volMin": 500}]',
  '[{"qty": 50, "descuento": 0, "tipo": "Mayorista inicial"}, {"qty": 100, "descuento": 0.06, "tipo": "Mayorista estándar"}, {"qty": 200, "descuento": 0.09, "tipo": "Mayorista frecuente"}, {"qty": 500, "descuento": 0.12, "tipo": "Distribuidor"}, {"qty": 1000, "descuento": 0.15, "tipo": "Distribuidor grande"}]',
  '[{"uso": "Eventos corporativos", "volumen": "100-500 pzas", "precio": "$75-85"}, {"uso": "Promocionales empresa", "volumen": "200-1000 pzas", "precio": "$70-80"}, {"uso": "Escuelas/Universidades", "volumen": "100-300 pzas", "precio": "$80-85"}, {"uso": "Supermercados eco", "volumen": "500-2000 pzas", "precio": "$65-70"}]',
  null, null, 3),

('estandar', 'ESTANDAR', '👜', 'Loneta + Forro Económico - 2 Bolsillos', 'Loneta + Forro Económico',
  '{"dimensiones": "35 x 40 cm", "exterior": "Loneta 100% algodón estampada (0.50m)", "forro": "Tela económica (popelina/manta delgada)", "bolsillos": "2 bolsillos laterales abiertos", "acabado": "Costuras reforzadas"}',
  '{"loneta": 34.5, "forro": 5.25, "maquila": 16, "insumos": 2.5, "merma": 2.75}',
  61, 180, 120, 119, 59, 195, 97, '#2980B9', '#D6EAF8', 'Balance precio/calidad, cliente recurrente', null,
  '[{"nombre": "Conservador", "precio": 130, "pvp": 180, "volMin": 20}, {"nombre": "Equilibrado", "precio": 120, "pvp": 170, "volMin": 30, "recomendado": true}, {"nombre": "Agresivo", "precio": 110, "pvp": 160, "volMin": 50}, {"nombre": "Ultra-agresivo", "precio": 100, "pvp": 150, "volMin": 100}]',
  '[{"qty": 20, "descuento": 0, "tipo": "Mayorista inicial"}, {"qty": 30, "descuento": 0.025, "tipo": "Mayorista estándar"}, {"qty": 50, "descuento": 0.05, "tipo": "Mayorista frecuente"}, {"qty": 100, "descuento": 0.08, "tipo": "Distribuidor"}, {"qty": 200, "descuento": 0.10, "tipo": "Distribuidor Plus"}]',
  '[{"uso": "Tiendas boutique", "volumen": "30-100 pzas", "precio": "$115-120"}, {"uso": "Regalos corporativos", "volumen": "50-200 pzas", "precio": "$110-115"}, {"uso": "Mercados artesanales", "volumen": "20-50 pzas", "precio": "$120"}]',
  null, null, 4),

('premium', 'PREMIUM', '👛', 'Loneta + Manta Teñida - 2 Bolsillos - Artesanal', 'Loneta + Forro Manta Teñida',
  '{"dimensiones": "35 x 40 cm", "exterior": "Loneta 100% algodón estampada (0.55m)", "forro": "Manta teñida artesanal (0.45m)", "bolsillos": "2 bolsillos laterales", "acabado": "Confección elaborada premium"}',
  '{"loneta": 37.95, "forro": 18.9, "maquila": 18, "insumos": 3, "merma": 4.15}',
  82, 250, 165, 168, 80, 205, 98, '#8E44AD', '#E8DAEF', 'Máxima calidad, regalo, cliente exigente', null,
  '[{"nombre": "Conservador", "precio": 180, "pvp": 250, "volMin": 20}, {"nombre": "Equilibrado", "precio": 165, "pvp": 240, "volMin": 30, "recomendado": true}, {"nombre": "Agresivo", "precio": 150, "pvp": 220, "volMin": 50}, {"nombre": "Ultra-agresivo", "precio": 140, "pvp": 200, "volMin": 100}]',
  '[{"qty": 20, "descuento": 0, "tipo": "Mayorista inicial"}, {"qty": 30, "descuento": 0.03, "tipo": "Mayorista estándar"}, {"qty": 50, "descuento": 0.05, "tipo": "Mayorista frecuente"}, {"qty": 100, "descuento": 0.08, "tipo": "Distribuidor"}, {"qty": 200, "descuento": 0.10, "tipo": "Distribuidor Plus"}]',
  '[{"uso": "Boutiques premium", "volumen": "20-50 pzas", "precio": "$165"}, {"uso": "Regalos ejecutivos", "volumen": "30-100 pzas", "precio": "$160-165"}, {"uso": "Tiendas eco-luxury", "volumen": "50-100 pzas", "precio": "$150-160"}]',
  null, null, 5),

('publicitaria', 'PUBLICITARIA', '📢', 'Manta Cruda - Serigrafía - Ultra Económica', 'Manta 160g 100% Algodón',
  '{"dimensiones": "35 x 40 cm", "exterior": "Manta cruda 160g (1.80m ancho = 4 bolsas/m)", "forro": "Sin forro", "bolsillos": "Sin bolsillos", "acabado": "Costuras simples, ideal para serigrafía"}',
  '{"manta": 6.25, "forro": 0, "maquila": 6, "insumos": 1.5, "merma": 0.69, "serigrafia1": 5}',
  20, 45, 30, 25, 10, 125, 50, '#95A5A6', '#F2F3F4', 'Eventos masivos, campañas, promocionales corporativos', 'Manta 1.80m = 4 bolsas/metro, costo ultra bajo',
  '[{"nombre": "Conservador", "precio": 35, "pvp": 50, "volMin": 100}, {"nombre": "Equilibrado", "precio": 30, "pvp": 45, "volMin": 200, "recomendado": true}, {"nombre": "Agresivo", "precio": 25, "pvp": 40, "volMin": 500}, {"nombre": "Ultra-agresivo", "precio": 22, "pvp": 35, "volMin": 1000}, {"nombre": "Volumen extremo", "precio": 20, "pvp": 30, "volMin": 2000}]',
  '[{"qty": 100, "descuento": 0, "tipo": "Mayorista inicial"}, {"qty": 200, "descuento": 0.05, "tipo": "Mayorista estándar"}, {"qty": 500, "descuento": 0.10, "tipo": "Mayorista frecuente"}, {"qty": 1000, "descuento": 0.15, "tipo": "Distribuidor"}, {"qty": 2000, "descuento": 0.20, "tipo": "Distribuidor grande"}, {"qty": 5000, "descuento": 0.25, "tipo": "Distribuidor Premium"}]',
  '[{"uso": "Eventos masivos", "volumen": "500-5000 pzas", "precio": "$20-25"}, {"uso": "Campañas gobierno", "volumen": "1000-10000 pzas", "precio": "$18-22"}, {"uso": "Promocionales empresa", "volumen": "200-1000 pzas", "precio": "$25-30"}, {"uso": "Ferias y exposiciones", "volumen": "500-2000 pzas", "precio": "$22-28"}, {"uso": "Supermercados", "volumen": "2000-10000 pzas", "precio": "$18-22"}, {"uso": "ONG / Fundaciones", "volumen": "500-3000 pzas", "precio": "$20-25"}]',
  '[{"nombre": "Pack 10x$350", "precioUnit": 35, "ahorro": "22%"}, {"nombre": "Pack 50x$1500", "precioUnit": 30, "ahorro": "33%"}, {"nombre": "Mayoreo 100+ pzas", "precioUnit": 28, "ahorro": "38%"}]',
  '{"serigrafia1": {"costo": "+$4-6/pza", "minimo": "100+", "descripcion": "1 tinta"}, "serigrafia2": {"costo": "+$7-9/pza", "minimo": "100+", "descripcion": "2 tintas"}, "serigrafia3": {"costo": "+$10-12/pza", "minimo": "100+", "descripcion": "3 tintas"}}',
  0)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  icon = EXCLUDED.icon,
  descripcion = EXCLUDED.descripcion,
  material = EXCLUDED.material,
  especificaciones = EXCLUDED.especificaciones,
  costos = EXCLUDED.costos,
  costo_total = EXCLUDED.costo_total,
  precio_publico = EXCLUDED.precio_publico,
  precio_mayoreo = EXCLUDED.precio_mayoreo,
  color = EXCLUDED.color,
  color_light = EXCLUDED.color_light,
  target = EXCLUDED.target,
  escenarios = EXCLUDED.escenarios,
  volumenes = EXCLUDED.volumenes,
  casos = EXCLUDED.casos,
  promociones = EXCLUDED.promociones,
  orden = EXCLUDED.orden,
  updated_at = NOW();

-- Proyecciones mensuales
INSERT INTO proyecciones (mes, mes_numero, ventas, publicitaria, eco, eco_forro, basica, estandar, premium, ecomm, directa, mayoreo, modelos, utilidad, acumulado) VALUES
('Mes 1', 1, 20, 2, 3, 3, 3, 5, 4, 6, 6, 8, 15, 1580, 1580),
('Mes 2', 2, 28, 3, 4, 4, 4, 8, 5, 8, 8, 12, 25, 2240, 3820),
('Mes 3', 3, 38, 4, 6, 6, 6, 10, 6, 11, 11, 16, 35, 3040, 6860),
('Mes 4', 4, 50, 5, 7, 7, 8, 13, 10, 15, 15, 20, 45, 4000, 10860),
('Mes 5', 5, 65, 6, 10, 10, 10, 16, 13, 20, 20, 25, 55, 5200, 16060),
('Mes 6', 6, 80, 8, 12, 12, 12, 20, 16, 24, 24, 32, 65, 6400, 22460),
('Mes 7', 7, 95, 10, 14, 14, 14, 24, 19, 28, 28, 39, 75, 7600, 30060),
('Mes 8', 8, 115, 12, 17, 17, 17, 29, 23, 34, 34, 47, 85, 9200, 39260),
('Mes 9', 9, 132, 13, 20, 20, 20, 33, 26, 40, 40, 52, 92, 10560, 49820),
('Mes 10', 10, 150, 15, 22, 23, 22, 38, 30, 45, 45, 60, 100, 12000, 61820)
ON CONFLICT DO NOTHING;

-- Canales E-commerce
INSERT INTO canales_ecommerce (canal, precio, utilidad, margen, pros, contras, orden) VALUES
('ML Pack 2x$399', 399, 47, 54, 'Alto tráfico', 'Comisiones altas', 1),
('ML $299', 299, 41, 47, 'Envío gratis cliente', 'Margen bajo', 2),
('Amazon $299', 299, 57, 65, 'Mejor margen, Prime', 'Más competencia', 3),
('Directa + Skydropx', 220, 62, 71, 'Control total', 'Sin tráfico orgánico', 4),
('Directa + DiDi Local', 250, 118, 136, 'Máxima utilidad', 'Solo Puebla', 5),
('Promo 2x$400 local', 400, 98, 119, 'Volumen + utilidad', 'Requiere marketing', 6)
ON CONFLICT DO NOTHING;

-- Costos de envío
INSERT INTO costos_envio (tipo, servicio, tarifa, tiempo, nota, orden) VALUES
('local', 'DiDi Entrega Light', 29, 'Mismo día', 'Más económico', 1),
('local', 'Uber Flash Moto', 38, 'Mismo día', 'Hasta 16 km', 2),
('local', 'Uber Envíos (auto)', 40, 'Mismo día', 'Paquetes grandes', 3),
('local', 'Rappi Favores', 45, 'Mismo día', 'Después de 4 km', 4),
('nacional', '99 Minutos', 85, 'Next Day', 'Nacional', 5),
('nacional', 'EnvíaTodo', 63, '3-5 días', 'Mejor precio', 6),
('nacional', 'EnvíaYa', 73, '3-5 días', 'Sin mínimo', 7),
('nacional', 'EnvíosPerros', 85, '3-5 días', 'Fácil de usar', 8)
ON CONFLICT DO NOTHING;

-- Personalización
INSERT INTO personalizacion (tipo, costo, minimo, ideal, orden) VALUES
('Serigrafía 1 tinta', '+$8-12/pza', '100+', 'Logo, texto simple', 1),
('Serigrafía 2 tintas', '+$15-18/pza', '100+', 'Diseños bicolor', 2),
('Sublimación', '+$20-25/pza', '50+', 'Full color, fotos', 3),
('Bordado', '+$25-35/pza', '50+', 'Look premium', 4),
('Etiqueta personalizada', '+$3-5/pza', '100+', 'Marca del cliente', 5)
ON CONFLICT DO NOTHING;

-- Tipos de diseño
INSERT INTO tipos_diseno (id, nombre, icon, descripcion, popularidad, temporada, target, ejemplos, colores, tendencia, orden) VALUES
('florales', 'Florales', '🌸', 'Patrones botánicos, flores silvestres, jardines', 95, 'Primavera/Verano', 'Mujeres 25-45 años', '["Rosas vintage", "Flores silvestres", "Hojas tropicales", "Jardín inglés"]', '["Rosa pastel", "Verde sage", "Terracota", "Crema"]', 'alta', 1),
('geometricos', 'Geométricos', '◆', 'Líneas, formas abstractas, patrones repetitivos', 80, 'Todo el año', 'Unisex, millennials', '["Líneas minimalistas", "Azteca moderno", "Art deco", "Bauhaus"]', '["Negro/Blanco", "Mostaza", "Azul marino", "Terracota"]', 'media', 2),
('artisticos', 'Artísticos', '🎨', 'Ilustraciones, arte original, pinturas', 85, 'Todo el año', 'Creativos, artistas', '["Acuarelas", "Ilustración botánica", "Retratos", "Arte abstracto"]', '["Multicolor", "Tonos tierra", "Pasteles"]', 'alta', 3),
('lettering', 'Lettering/Frases', '✎', 'Tipografía, frases motivacionales, quotes', 75, 'Todo el año', 'Jóvenes 18-35', '["Frases positivas", "Nombres propios", "Ciudades", "Fechas especiales"]', '["Negro sobre natural", "Dorado", "Rosa gold"]', 'media', 4),
('animales', 'Animales', '🦋', 'Fauna, mascotas, criaturas ilustradas', 70, 'Todo el año', 'Amantes de animales', '["Gatos", "Perros", "Mariposas", "Aves", "Animales mexicanos"]', '["Natural", "Colores vivos", "Tonos tierra"]', 'media', 5),
('mexicano', 'Mexicano/Artesanal', '🇲🇽', 'Cultura mexicana, bordados, tradiciones', 90, 'Todo el año (pico en Sept)', 'Turistas, mexicanos orgullosos', '["Otomí", "Talavera", "Día de muertos", "Alebrije", "Tenango"]', '["Multicolor vibrante", "Rojo/Verde", "Azul talavera"]', 'alta', 6),
('minimalista', 'Minimalista', '○', 'Diseños simples, elegantes, menos es más', 88, 'Todo el año', 'Profesionales, estilo clean', '["Una línea", "Punto focal", "Logo discreto", "Textura sutil"]', '["Crudo natural", "Negro", "Gris", "Beige"]', 'alta', 7),
('vintage', 'Vintage/Retro', '📻', 'Estética nostálgica, décadas pasadas', 72, 'Otoño/Invierno', 'Hipsters, nostálgicos', '["70s groovy", "Art nouveau", "Publicidad retro", "Mapas antiguos"]', '["Mostaza", "Naranja quemado", "Verde olivo", "Marrón"]', 'media', 8)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  icon = EXCLUDED.icon,
  descripcion = EXCLUDED.descripcion,
  popularidad = EXCLUDED.popularidad,
  temporada = EXCLUDED.temporada,
  target = EXCLUDED.target,
  ejemplos = EXCLUDED.ejemplos,
  colores = EXCLUDED.colores,
  tendencia = EXCLUDED.tendencia,
  orden = EXCLUDED.orden,
  updated_at = NOW();

-- Colecciones
INSERT INTO colecciones (nombre, temporada, modelos_count, disenos, lineas, estado, ventas, rating, orden) VALUES
('Primavera Botánica', 'Primavera 2024', 12, '["Flores silvestres", "Hojas monstera", "Jardín secreto", "Rosas vintage"]', '["Estándar", "Premium"]', 'activa', 145, 4.8, 1),
('Puebla Artesanal', 'Todo el año', 15, '["Talavera azul", "Bordado Otomí", "Catrina elegante", "Tenango colorido"]', '["Básica", "Estándar", "Premium"]', 'activa', 230, 4.9, 2),
('Minimal Chic', 'Todo el año', 8, '["Línea continua", "Monograma", "Geometric black", "Pure cotton"]', '["Estándar", "Premium"]', 'activa', 180, 4.7, 3),
('Verano Tropical', 'Verano 2024', 10, '["Palmeras", "Tucanes", "Frutas tropicales", "Atardecer playa"]', '["Básica", "Estándar"]', 'próxima', 0, 0, 4),
('Edición Corporativa', 'Todo el año', 5, '["Logo empresa", "Colores corporativos", "Evento especial"]', '["Básica"]', 'activa', 320, 4.6, 5)
ON CONFLICT DO NOTHING;

-- Configuración inicial
INSERT INTO configuracion (clave, valor, descripcion) VALUES
('inversion_inicial', '15000', 'Inversión inicial del proyecto'),
('meses_proyeccion', '10', 'Meses de proyección'),
('meta_modelos', '100', 'Meta de modelos totales')
ON CONFLICT (clave) DO UPDATE SET
  valor = EXCLUDED.valor,
  updated_at = NOW();

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================

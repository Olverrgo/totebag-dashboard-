-- =====================================================
-- SISTEMA BOM (Recetas) Y PRODUCCIÓN - BLANCOS SINAI
-- Ejecutar en Supabase SQL Editor
-- =====================================================
-- NOTA: productos.id y variantes_producto.id son INTEGER (serial),
-- por lo que las FK a esas tablas usan INTEGER, no UUID.

-- 1. MATERIALES — Inventario de materia prima
CREATE TABLE IF NOT EXISTS materiales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  unidad TEXT NOT NULL DEFAULT 'metros' CHECK (unidad IN ('metros','piezas','kilos','rollos','litros','conos')),
  stock NUMERIC NOT NULL DEFAULT 0,
  stock_minimo NUMERIC NOT NULL DEFAULT 0,
  costo_unitario NUMERIC NOT NULL DEFAULT 0,
  categoria TEXT NOT NULL DEFAULT 'otro' CHECK (categoria IN ('tela','cierre','hilo','etiqueta','empaque','otro')),
  proveedor TEXT,
  notas TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. RECETAS — BOM base por producto
CREATE TABLE IF NOT EXISTS recetas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materiales(id) ON DELETE CASCADE,
  cantidad NUMERIC NOT NULL DEFAULT 0,
  notas TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(producto_id, material_id)
);

-- 3. ORDENES_PRODUCCION — Órdenes de producción
CREATE TABLE IF NOT EXISTS ordenes_produccion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  variante_id INTEGER REFERENCES variantes_producto(id),
  cantidad INTEGER NOT NULL DEFAULT 1,
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador','en_proceso','completada','cancelada')),
  costo_total NUMERIC DEFAULT 0,
  costo_unitario_calculado NUMERIC DEFAULT 0,
  notas TEXT,
  fecha_inicio TIMESTAMPTZ DEFAULT now(),
  fecha_completada TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. MATERIALES_USADOS — Materiales consumidos por orden
CREATE TABLE IF NOT EXISTS materiales_usados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  orden_id UUID NOT NULL REFERENCES ordenes_produccion(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materiales(id),
  cantidad_planeada NUMERIC NOT NULL DEFAULT 0,
  cantidad_real NUMERIC,
  costo_unitario NUMERIC NOT NULL DEFAULT 0,
  costo_total NUMERIC NOT NULL DEFAULT 0
);

-- 5. MOVIMIENTOS_MATERIAL — Log de trazabilidad
CREATE TABLE IF NOT EXISTS movimientos_material (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES materiales(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('compra','produccion','ajuste')),
  cantidad NUMERIC NOT NULL,
  referencia_id UUID,
  referencia_tipo TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE recetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_produccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE materiales_usados ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_material ENABLE ROW LEVEL SECURITY;

-- Políticas: lectura para todos los autenticados, escritura para todos los autenticados
-- (ajustar según necesidades de roles)

CREATE POLICY "materiales_select" ON materiales FOR SELECT TO authenticated USING (true);
CREATE POLICY "materiales_insert" ON materiales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "materiales_update" ON materiales FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "materiales_delete" ON materiales FOR DELETE TO authenticated USING (true);

CREATE POLICY "recetas_select" ON recetas FOR SELECT TO authenticated USING (true);
CREATE POLICY "recetas_insert" ON recetas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "recetas_update" ON recetas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "recetas_delete" ON recetas FOR DELETE TO authenticated USING (true);

CREATE POLICY "ordenes_produccion_select" ON ordenes_produccion FOR SELECT TO authenticated USING (true);
CREATE POLICY "ordenes_produccion_insert" ON ordenes_produccion FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ordenes_produccion_update" ON ordenes_produccion FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ordenes_produccion_delete" ON ordenes_produccion FOR DELETE TO authenticated USING (true);

CREATE POLICY "materiales_usados_select" ON materiales_usados FOR SELECT TO authenticated USING (true);
CREATE POLICY "materiales_usados_insert" ON materiales_usados FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "materiales_usados_update" ON materiales_usados FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "materiales_usados_delete" ON materiales_usados FOR DELETE TO authenticated USING (true);

CREATE POLICY "movimientos_material_select" ON movimientos_material FOR SELECT TO authenticated USING (true);
CREATE POLICY "movimientos_material_insert" ON movimientos_material FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "movimientos_material_update" ON movimientos_material FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "movimientos_material_delete" ON movimientos_material FOR DELETE TO authenticated USING (true);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_recetas_producto ON recetas(producto_id);
CREATE INDEX IF NOT EXISTS idx_recetas_material ON recetas(material_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_produccion_producto ON ordenes_produccion(producto_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_produccion_estado ON ordenes_produccion(estado);
CREATE INDEX IF NOT EXISTS idx_materiales_usados_orden ON materiales_usados(orden_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_material_material ON movimientos_material(material_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_material_tipo ON movimientos_material(tipo);

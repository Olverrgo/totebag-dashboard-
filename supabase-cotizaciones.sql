-- =====================================================
-- FASE 10: COTIZACIONES + TIERS DE PRECIO POR CANAL
-- =====================================================
-- Enfoque A: el precio sugerido = costo de producción dinámico × multiplicador del tier.
-- detalle_cotizacion SNAPSHOTEA costo + tier + margen al cotizar (vivo para cotizar HOY,
-- congelado para análisis histórico).
-- Script idempotente (se puede correr varias veces).

-- =====================================================
-- 1. TIERS_PRECIO (catálogo editable de canales)
--    slug alineado a ventas.tipo_venta ('directa','consignacion','mayoreo','ecommerce')
-- =====================================================
CREATE TABLE IF NOT EXISTS tiers_precio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  multiplicador NUMERIC NOT NULL DEFAULT 1.0 CHECK (multiplicador > 0),
  activo BOOLEAN NOT NULL DEFAULT true,
  orden INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed inicial (multiplicadores TENTATIVOS — Rigo los ajusta en la app).
INSERT INTO tiers_precio (slug, nombre, multiplicador, orden) VALUES
  ('directa',      'Detalle / Directa', 2.0, 1),
  ('mayoreo',      'Mayoreo',           1.3, 2),
  ('consignacion', 'Consignación',      1.5, 3),
  ('ecommerce',    'Ecommerce',         1.8, 4)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 2. SECUENCIAS_FOLIO (contador robusto por año, reset anual)
-- =====================================================
CREATE TABLE IF NOT EXISTS secuencias_folio (
  anio INTEGER PRIMARY KEY,
  ultimo INTEGER NOT NULL DEFAULT 0
);

-- =====================================================
-- 3. COTIZACIONES (cabecera)
-- =====================================================
CREATE TABLE IF NOT EXISTS cotizaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  folio TEXT UNIQUE,
  cliente_id INTEGER REFERENCES clientes(id),
  cliente_nombre TEXT,
  tier_id UUID REFERENCES tiers_precio(id),
  estado TEXT NOT NULL DEFAULT 'borrador'
    CHECK (estado IN ('borrador','enviada','aceptada','rechazada','vencida')),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  vigencia_dias INTEGER NOT NULL DEFAULT 15,
  total NUMERIC NOT NULL DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- 4. DETALLE_COTIZACION (líneas — aquí vive el SNAPSHOT ⭐)
-- =====================================================
CREATE TABLE IF NOT EXISTS detalle_cotizacion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cotizacion_id UUID NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
  producto_id INTEGER REFERENCES productos(id),
  variante_id INTEGER REFERENCES variantes_producto(id),
  descripcion TEXT,                          -- snapshot del nombre del producto/variante
  cantidad NUMERIC NOT NULL CHECK (cantidad > 0),
  costo_snapshot NUMERIC NOT NULL DEFAULT 0, -- ⭐ costo de producción congelado al cotizar
  tier_multiplicador NUMERIC NOT NULL DEFAULT 1.0, -- ⭐ multiplicador aplicado
  precio_unitario NUMERIC NOT NULL CHECK (precio_unitario >= 0), -- sugerido (costo×mult) o override manual
  es_override BOOLEAN NOT NULL DEFAULT false,
  margen_unitario NUMERIC GENERATED ALWAYS AS (precio_unitario - costo_snapshot) STORED,
  subtotal NUMERIC GENERATED ALWAYS AS (cantidad * precio_unitario) STORED
);

CREATE INDEX IF NOT EXISTS idx_detalle_cotizacion_cot ON detalle_cotizacion(cotizacion_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- A. Folio automático COT-AAAA-NNN (solo si no viene ya seteado).
--    Usa secuencias_folio con upsert atómico → sin colisiones por concurrencia.
--    SECURITY DEFINER para poder escribir el contador aunque secuencias_folio tenga RLS.
CREATE OR REPLACE FUNCTION fn_generar_folio_cotizacion()
RETURNS TRIGGER AS $$
DECLARE
  v_anio INTEGER := EXTRACT(YEAR FROM COALESCE(NEW.fecha, CURRENT_DATE))::INTEGER;
  v_next INTEGER;
BEGIN
  IF NEW.folio IS NULL THEN
    INSERT INTO secuencias_folio (anio, ultimo)
    VALUES (v_anio, 1)
    ON CONFLICT (anio) DO UPDATE SET ultimo = secuencias_folio.ultimo + 1
    RETURNING ultimo INTO v_next;

    NEW.folio := 'COT-' || v_anio || '-' || LPAD(v_next::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS tr_generar_folio_cotizacion ON cotizaciones;
CREATE TRIGGER tr_generar_folio_cotizacion
BEFORE INSERT ON cotizaciones
FOR EACH ROW EXECUTE FUNCTION fn_generar_folio_cotizacion();

-- B. Recalcular el total de la cabecera desde las líneas (INSERT/UPDATE/DELETE).
CREATE OR REPLACE FUNCTION fn_recalcular_total_cotizacion()
RETURNS TRIGGER AS $$
DECLARE
  v_cot_id UUID := COALESCE(NEW.cotizacion_id, OLD.cotizacion_id);
BEGIN
  UPDATE cotizaciones
     SET total = (SELECT COALESCE(SUM(subtotal), 0)
                    FROM detalle_cotizacion
                   WHERE cotizacion_id = v_cot_id)
   WHERE id = v_cot_id;
  RETURN NULL; -- AFTER trigger
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_recalcular_total_cotizacion ON detalle_cotizacion;
CREATE TRIGGER tr_recalcular_total_cotizacion
AFTER INSERT OR UPDATE OR DELETE ON detalle_cotizacion
FOR EACH ROW EXECUTE FUNCTION fn_recalcular_total_cotizacion();

-- =====================================================
-- RLS (SEGURIDAD)
-- =====================================================
ALTER TABLE tiers_precio        ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones        ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_cotizacion  ENABLE ROW LEVEL SECURITY;
ALTER TABLE secuencias_folio    ENABLE ROW LEVEL SECURITY;
-- secuencias_folio: SIN políticas a propósito. Solo el trigger SECURITY DEFINER la toca.

-- tiers_precio
DROP POLICY IF EXISTS "sel_tier" ON tiers_precio;
DROP POLICY IF EXISTS "ins_tier" ON tiers_precio;
DROP POLICY IF EXISTS "upd_tier" ON tiers_precio;
DROP POLICY IF EXISTS "del_tier" ON tiers_precio;
CREATE POLICY "sel_tier" ON tiers_precio FOR SELECT TO authenticated USING (true);
CREATE POLICY "ins_tier" ON tiers_precio FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "upd_tier" ON tiers_precio FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "del_tier" ON tiers_precio FOR DELETE TO authenticated USING (true);

-- cotizaciones
DROP POLICY IF EXISTS "sel_cot" ON cotizaciones;
DROP POLICY IF EXISTS "ins_cot" ON cotizaciones;
DROP POLICY IF EXISTS "upd_cot" ON cotizaciones;
DROP POLICY IF EXISTS "del_cot" ON cotizaciones;
CREATE POLICY "sel_cot" ON cotizaciones FOR SELECT TO authenticated USING (true);
CREATE POLICY "ins_cot" ON cotizaciones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "upd_cot" ON cotizaciones FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "del_cot" ON cotizaciones FOR DELETE TO authenticated USING (true);

-- detalle_cotizacion
DROP POLICY IF EXISTS "sel_det_cot" ON detalle_cotizacion;
DROP POLICY IF EXISTS "ins_det_cot" ON detalle_cotizacion;
DROP POLICY IF EXISTS "upd_det_cot" ON detalle_cotizacion;
DROP POLICY IF EXISTS "del_det_cot" ON detalle_cotizacion;
CREATE POLICY "sel_det_cot" ON detalle_cotizacion FOR SELECT TO authenticated USING (true);
CREATE POLICY "ins_det_cot" ON detalle_cotizacion FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "upd_det_cot" ON detalle_cotizacion FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "del_det_cot" ON detalle_cotizacion FOR DELETE TO authenticated USING (true);

-- =====================================================
-- VERIFICACIÓN (opcional, correr a mano)
-- =====================================================
-- SELECT * FROM tiers_precio ORDER BY orden;
-- INSERT INTO cotizaciones (cliente_nombre, tier_id) VALUES ('Prueba', (SELECT id FROM tiers_precio WHERE slug='mayoreo'));
-- SELECT folio, total, estado FROM cotizaciones ORDER BY created_at DESC LIMIT 3;

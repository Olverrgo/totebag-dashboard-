-- =====================================================
-- MÓDULO DE COMPRAS DE MATERIA PRIMA Y CUENTAS POR PAGAR
-- =====================================================

-- =====================================================
-- 1. PROVEEDORES
-- =====================================================
CREATE TABLE IF NOT EXISTS proveedores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  contacto TEXT,
  telefono TEXT,
  email TEXT,
  direccion TEXT,
  notas TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 2. COMPRAS_MATERIAL (Cabecera)
-- =====================================================
CREATE TABLE IF NOT EXISTS compras_material (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proveedor_id UUID REFERENCES proveedores(id),
  monto_total NUMERIC NOT NULL DEFAULT 0,
  monto_pagado NUMERIC NOT NULL DEFAULT 0,
  saldo_pendiente NUMERIC GENERATED ALWAYS AS (monto_total - monto_pagado) STORED,
  estado_pago TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'parcial', 'pagado')),
  fecha_compra DATE NOT NULL DEFAULT CURRENT_DATE,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- 3. DETALLE_COMPRA_MATERIAL (Líneas)
-- =====================================================
CREATE TABLE IF NOT EXISTS detalle_compra_material (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  compra_id UUID NOT NULL REFERENCES compras_material(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materiales(id),
  cantidad NUMERIC NOT NULL CHECK (cantidad > 0),
  costo_unitario NUMERIC NOT NULL CHECK (costo_unitario >= 0),
  subtotal NUMERIC GENERATED ALWAYS AS (cantidad * costo_unitario) STORED
);

-- =====================================================
-- 4. PAGOS_PROVEEDORES (Abonos)
-- =====================================================
CREATE TABLE IF NOT EXISTS pagos_proveedores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  compra_id UUID NOT NULL REFERENCES compras_material(id) ON DELETE CASCADE,
  monto NUMERIC NOT NULL CHECK (monto > 0),
  fecha_pago TIMESTAMPTZ DEFAULT now(),
  metodo_pago TEXT DEFAULT 'transferencia' CHECK (metodo_pago IN ('efectivo', 'transferencia', 'tarjeta', 'otro')),
  movimiento_caja_id INTEGER REFERENCES movimientos_caja(id),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- TRIGGERS Y AUTOMATIZACIÓN
-- =====================================================

-- =====================================================
-- A. Actualizar stock y costo al insertar detalle
-- =====================================================
CREATE OR REPLACE FUNCTION fn_actualizar_stock_por_compra()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE materiales
     SET stock = stock + NEW.cantidad,
         costo_unitario = NEW.costo_unitario,
         proveedor = (SELECT nombre FROM proveedores WHERE id = (SELECT proveedor_id FROM compras_material WHERE id = NEW.compra_id))
   WHERE id = NEW.material_id;

  INSERT INTO movimientos_material (material_id, tipo, cantidad, notas)
  VALUES (NEW.material_id, 'compra', NEW.cantidad, 'Compra ID: ' || NEW.compra_id);

  UPDATE compras_material
     SET monto_total = (SELECT COALESCE(SUM(subtotal), 0) FROM detalle_compra_material WHERE compra_id = NEW.compra_id)
   WHERE id = NEW.compra_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_actualizar_stock_por_compra ON detalle_compra_material;
CREATE TRIGGER tr_actualizar_stock_por_compra
AFTER INSERT ON detalle_compra_material
FOR EACH ROW EXECUTE FUNCTION fn_actualizar_stock_por_compra();

-- =====================================================
-- B. Registrar abono en CAJA (egreso) y ligarlo al pago
--    BEFORE INSERT: crea el movimiento de caja y guarda su id en
--    NEW.movimiento_caja_id (sin segundo UPDATE).
-- =====================================================
CREATE OR REPLACE FUNCTION fn_pago_proveedor_a_caja()
RETURNS TRIGGER AS $$
DECLARE
  v_nombre_prov TEXT;
  v_caja_id INTEGER;
BEGIN
  -- Solo si no viene ya ligado (evita duplicar el egreso)
  IF NEW.movimiento_caja_id IS NULL THEN
    SELECT pr.nombre INTO v_nombre_prov
      FROM compras_material cm
      JOIN proveedores pr ON pr.id = cm.proveedor_id
     WHERE cm.id = NEW.compra_id;

    INSERT INTO movimientos_caja
      (tipo, monto, categoria, metodo_pago, descripcion, referencia, fecha, created_by)
    VALUES (
      'egreso',
      NEW.monto,
      'compra_material',
      COALESCE(NEW.metodo_pago, 'transferencia'),
      'Pago a proveedor' || COALESCE(' - ' || v_nombre_prov, '')
        || ' (compra ' || NEW.compra_id || ')',
      'compra_material:' || NEW.compra_id,
      COALESCE(NEW.fecha_pago, now()),
      NEW.created_by
    )
    RETURNING id INTO v_caja_id;

    NEW.movimiento_caja_id := v_caja_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS tr_pago_proveedor_a_caja ON pagos_proveedores;
CREATE TRIGGER tr_pago_proveedor_a_caja
BEFORE INSERT ON pagos_proveedores
FOR EACH ROW EXECUTE FUNCTION fn_pago_proveedor_a_caja();

-- =====================================================
-- C. Actualizar estado de pago de la compra (INSERT y DELETE)
--    En DELETE usa OLD (en un DELETE no existe NEW) y desactiva
--    el egreso de caja ligado para que las cuentas cuadren.
-- =====================================================
CREATE OR REPLACE FUNCTION fn_actualizar_pago_compra()
RETURNS TRIGGER AS $$
DECLARE
  v_compra_id UUID := COALESCE(NEW.compra_id, OLD.compra_id);
  v_total NUMERIC;
  v_pagado NUMERIC;
BEGIN
  -- Si se borró un abono, desactivar (soft-delete) su egreso de caja
  IF TG_OP = 'DELETE' AND OLD.movimiento_caja_id IS NOT NULL THEN
    UPDATE movimientos_caja SET activo = false WHERE id = OLD.movimiento_caja_id;
  END IF;

  SELECT COALESCE(SUM(monto), 0) INTO v_pagado
    FROM pagos_proveedores WHERE compra_id = v_compra_id;
  SELECT monto_total INTO v_total
    FROM compras_material WHERE id = v_compra_id;

  UPDATE compras_material
     SET monto_pagado = v_pagado,
         estado_pago = CASE
           WHEN v_total > 0 AND v_pagado >= v_total THEN 'pagado'
           WHEN v_pagado > 0 THEN 'parcial'
           ELSE 'pendiente'
         END
   WHERE id = v_compra_id;

  RETURN NULL; -- AFTER trigger: el valor de retorno se ignora
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS tr_actualizar_pago_compra ON pagos_proveedores;
CREATE TRIGGER tr_actualizar_pago_compra
AFTER INSERT OR DELETE ON pagos_proveedores
FOR EACH ROW EXECUTE FUNCTION fn_actualizar_pago_compra();

-- =====================================================
-- RLS (SEGURIDAD)
-- =====================================================
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras_material ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_compra_material ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos_proveedores ENABLE ROW LEVEL SECURITY;

-- Lectura para autenticados
DROP POLICY IF EXISTS "select_prov" ON proveedores;
DROP POLICY IF EXISTS "select_comp" ON compras_material;
DROP POLICY IF EXISTS "select_det"  ON detalle_compra_material;
DROP POLICY IF EXISTS "select_pago" ON pagos_proveedores;
CREATE POLICY "select_prov" ON proveedores            FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_comp" ON compras_material       FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_det"  ON detalle_compra_material FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_pago" ON pagos_proveedores      FOR SELECT TO authenticated USING (true);

-- Escritura para autenticados (sin esto, RLS bloquea TODOS los inserts/updates).
-- INSERT necesita WITH CHECK; UPDATE/DELETE necesitan USING.
DROP POLICY IF EXISTS "ins_prov" ON proveedores;
DROP POLICY IF EXISTS "upd_prov" ON proveedores;
DROP POLICY IF EXISTS "del_prov" ON proveedores;
DROP POLICY IF EXISTS "ins_comp" ON compras_material;
DROP POLICY IF EXISTS "upd_comp" ON compras_material;
DROP POLICY IF EXISTS "del_comp" ON compras_material;
DROP POLICY IF EXISTS "ins_det"  ON detalle_compra_material;
DROP POLICY IF EXISTS "upd_det"  ON detalle_compra_material;
DROP POLICY IF EXISTS "del_det"  ON detalle_compra_material;
DROP POLICY IF EXISTS "ins_pago" ON pagos_proveedores;
DROP POLICY IF EXISTS "upd_pago" ON pagos_proveedores;
DROP POLICY IF EXISTS "del_pago" ON pagos_proveedores;

CREATE POLICY "ins_prov"  ON proveedores            FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "upd_prov"  ON proveedores            FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "del_prov"  ON proveedores            FOR DELETE TO authenticated USING (true);

CREATE POLICY "ins_comp"  ON compras_material       FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "upd_comp"  ON compras_material       FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "del_comp"  ON compras_material       FOR DELETE TO authenticated USING (true);

CREATE POLICY "ins_det"   ON detalle_compra_material FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "upd_det"   ON detalle_compra_material FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "del_det"   ON detalle_compra_material FOR DELETE TO authenticated USING (true);

CREATE POLICY "ins_pago"  ON pagos_proveedores      FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "upd_pago"  ON pagos_proveedores      FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "del_pago"  ON pagos_proveedores      FOR DELETE TO authenticated USING (true);

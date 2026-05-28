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

CREATE TRIGGER tr_actualizar_stock_por_compra
AFTER INSERT ON detalle_compra_material
FOR EACH ROW EXECUTE FUNCTION fn_actualizar_stock_por_compra();

-- =====================================================
-- B. Actualizar estado de pago al registrar abono
-- =====================================================
CREATE OR REPLACE FUNCTION fn_actualizar_pago_compra()
RETURNS TRIGGER AS $$
DECLARE
  v_total NUMERIC;
  v_pagado NUMERIC;
BEGIN
  SELECT COALESCE(SUM(monto), 0) INTO v_pagado FROM pagos_proveedores WHERE compra_id = NEW.compra_id;
  SELECT monto_total INTO v_total FROM compras_material WHERE id = NEW.compra_id;

  UPDATE compras_material
     SET monto_pagado = v_pagado,
         estado_pago = CASE 
           WHEN v_pagado >= v_total THEN 'pagado'
           WHEN v_pagado > 0 THEN 'parcial'
           ELSE 'pendiente'
         END
   WHERE id = NEW.compra_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

CREATE POLICY "select_prov" ON proveedores FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_comp" ON compras_material FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_det" ON detalle_compra_material FOR SELECT TO authenticated USING (true);
CREATE POLICY "select_pago" ON pagos_proveedores FOR SELECT TO authenticated USING (true);

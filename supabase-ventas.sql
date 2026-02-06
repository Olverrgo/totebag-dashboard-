-- =====================================================
-- SECCIÓN VENTAS - Blancos Sinai
-- Registro de ventas con precios, pagos y utilidades
-- =====================================================

-- =====================================================
-- 1. TABLA VENTAS
-- =====================================================
CREATE TABLE IF NOT EXISTS ventas (
  id SERIAL PRIMARY KEY,

  -- Relaciones
  producto_id INTEGER REFERENCES productos(id),
  cliente_id INTEGER REFERENCES clientes(id),
  movimiento_id INTEGER REFERENCES movimientos_stock(id), -- Opcional: enlace al movimiento de stock

  -- Datos del producto (snapshot al momento de la venta)
  producto_nombre VARCHAR(200),
  producto_medidas VARCHAR(100),

  -- Datos del cliente (snapshot)
  cliente_nombre VARCHAR(200),

  -- Detalles de la venta
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario >= 0),
  subtotal DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
  descuento_porcentaje DECIMAL(5,2) DEFAULT 0 CHECK (descuento_porcentaje >= 0 AND descuento_porcentaje <= 100),
  descuento_monto DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,

  -- Costos y utilidad
  costo_unitario DECIMAL(10,2) DEFAULT 0, -- Costo del producto al momento de la venta
  costo_total DECIMAL(10,2) DEFAULT 0,
  utilidad DECIMAL(10,2) DEFAULT 0, -- total - costo_total
  margen_porcentaje DECIMAL(5,2) DEFAULT 0,

  -- Pago
  metodo_pago VARCHAR(50) DEFAULT 'efectivo' CHECK (metodo_pago IN ('efectivo', 'transferencia', 'tarjeta', 'credito', 'otro')),
  estado_pago VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_pago IN ('pagado', 'pendiente', 'parcial', 'cancelado')),
  monto_pagado DECIMAL(10,2) DEFAULT 0,
  monto_pendiente DECIMAL(10,2) GENERATED ALWAYS AS (total - monto_pagado) STORED,
  fecha_pago TIMESTAMP WITH TIME ZONE,

  -- Tipo de venta
  tipo_venta VARCHAR(30) DEFAULT 'directa' CHECK (tipo_venta IN ('directa', 'consignacion', 'mayoreo', 'ecommerce')),
  canal VARCHAR(50), -- Amazon, MercadoLibre, Tienda física, etc.

  -- Metadata
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  activo BOOLEAN DEFAULT true
);

-- =====================================================
-- 2. ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_ventas_producto ON ventas(producto_id);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON ventas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(created_at);
CREATE INDEX IF NOT EXISTS idx_ventas_estado_pago ON ventas(estado_pago);
CREATE INDEX IF NOT EXISTS idx_ventas_tipo ON ventas(tipo_venta);
CREATE INDEX IF NOT EXISTS idx_ventas_activo ON ventas(activo);

-- Índice compuesto para reportes por fecha
CREATE INDEX IF NOT EXISTS idx_ventas_fecha_activo ON ventas(created_at, activo);

-- =====================================================
-- 3. TRIGGER PARA UPDATED_AT
-- =====================================================
DROP TRIGGER IF EXISTS update_ventas_updated_at ON ventas;
CREATE TRIGGER update_ventas_updated_at
  BEFORE UPDATE ON ventas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;

-- Lectura para usuarios autenticados
CREATE POLICY "Ventas: lectura para autenticados" ON ventas
  FOR SELECT USING (auth.role() = 'authenticated');

-- Escritura solo para admin
CREATE POLICY "Ventas: escritura para admin" ON ventas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- =====================================================
-- 5. FUNCIÓN PARA CALCULAR UTILIDAD
-- =====================================================
CREATE OR REPLACE FUNCTION calcular_utilidad_venta()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular costo total
  NEW.costo_total := NEW.costo_unitario * NEW.cantidad;

  -- Calcular utilidad
  NEW.utilidad := NEW.total - NEW.costo_total;

  -- Calcular margen porcentaje
  IF NEW.total > 0 THEN
    NEW.margen_porcentaje := (NEW.utilidad / NEW.total) * 100;
  ELSE
    NEW.margen_porcentaje := 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calcular_utilidad ON ventas;
CREATE TRIGGER trigger_calcular_utilidad
  BEFORE INSERT OR UPDATE ON ventas
  FOR EACH ROW EXECUTE FUNCTION calcular_utilidad_venta();

-- =====================================================
-- 6. VISTA PARA RESUMEN DE VENTAS
-- =====================================================
CREATE OR REPLACE VIEW resumen_ventas_diario AS
SELECT
  DATE(created_at) as fecha,
  COUNT(*) as num_ventas,
  SUM(cantidad) as total_piezas,
  SUM(total) as total_ventas,
  SUM(utilidad) as total_utilidad,
  SUM(CASE WHEN estado_pago = 'pagado' THEN total ELSE 0 END) as total_cobrado,
  SUM(CASE WHEN estado_pago IN ('pendiente', 'parcial') THEN monto_pendiente ELSE 0 END) as total_por_cobrar
FROM ventas
WHERE activo = true
GROUP BY DATE(created_at)
ORDER BY fecha DESC;

-- =====================================================
-- 7. FUNCIÓN PARA OBTENER RESUMEN POR PERÍODO
-- =====================================================
CREATE OR REPLACE FUNCTION obtener_resumen_ventas(
  p_fecha_inicio DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_fecha_fin DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_ventas DECIMAL,
  total_piezas BIGINT,
  total_utilidad DECIMAL,
  total_cobrado DECIMAL,
  total_por_cobrar DECIMAL,
  num_ventas BIGINT,
  ticket_promedio DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(v.total), 0)::DECIMAL as total_ventas,
    COALESCE(SUM(v.cantidad), 0)::BIGINT as total_piezas,
    COALESCE(SUM(v.utilidad), 0)::DECIMAL as total_utilidad,
    COALESCE(SUM(CASE WHEN v.estado_pago = 'pagado' THEN v.total ELSE v.monto_pagado END), 0)::DECIMAL as total_cobrado,
    COALESCE(SUM(CASE WHEN v.estado_pago IN ('pendiente', 'parcial') THEN v.total - v.monto_pagado ELSE 0 END), 0)::DECIMAL as total_por_cobrar,
    COUNT(*)::BIGINT as num_ventas,
    CASE WHEN COUNT(*) > 0 THEN (SUM(v.total) / COUNT(*))::DECIMAL ELSE 0 END as ticket_promedio
  FROM ventas v
  WHERE v.activo = true
    AND DATE(v.created_at) >= p_fecha_inicio
    AND DATE(v.created_at) <= p_fecha_fin;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- SELECT * FROM ventas LIMIT 10;
-- SELECT * FROM resumen_ventas_diario;
-- SELECT * FROM obtener_resumen_ventas();

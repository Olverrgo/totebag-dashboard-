-- =====================================================
-- FASE 12: FOLIO DE ABONO (agrupar un pago como UN evento)
-- =====================================================
-- hacerPagoCliente distribuye un abono FIFO entre las ventas pendientes y crea
-- N ingresos en movimientos_caja (uno por producto que cubre). Para que el
-- estado de cuenta muestre el abono como UN evento ("28 may — abonó $1,000"),
-- estampamos un id de abono (AB-AAAA-MM-NNN) en todos esos ingresos.
-- Mismo patrón que el folio de venta. Script idempotente.

-- 1. Columna en movimientos_caja (aditiva, nullable: ingresos viejos sin grupo)
ALTER TABLE movimientos_caja ADD COLUMN IF NOT EXISTS abono_grupo TEXT;

-- Índice para agrupar/buscar rápido por abono
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_abono_grupo ON movimientos_caja(abono_grupo);

-- 2. Contador por (año, mes) — el consecutivo reinicia cada mes
CREATE TABLE IF NOT EXISTS folio_abono_seq (
  anio INTEGER NOT NULL,
  mes  INTEGER NOT NULL,
  ultimo INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (anio, mes)
);

-- 3. Función atómica que entrega el siguiente folio de abono.
--    SECURITY DEFINER para escribir el contador aunque la tabla tenga RLS.
--    Se llama UNA vez por pago (en registrarAbonoCliente) y ese folio se
--    estampa en los N ingresos de caja de ese mismo abono.
CREATE OR REPLACE FUNCTION siguiente_folio_abono()
RETURNS TEXT AS $$
DECLARE
  v_anio INTEGER := EXTRACT(YEAR  FROM CURRENT_DATE)::INTEGER;
  v_mes  INTEGER := EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER;
  v_next INTEGER;
BEGIN
  INSERT INTO folio_abono_seq (anio, mes, ultimo)
  VALUES (v_anio, v_mes, 1)
  ON CONFLICT (anio, mes) DO UPDATE SET ultimo = folio_abono_seq.ultimo + 1
  RETURNING ultimo INTO v_next;

  RETURN 'AB-' || v_anio || '-' || LPAD(v_mes::TEXT, 2, '0') || '-' || LPAD(v_next::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION siguiente_folio_abono() TO authenticated;

-- 4. RLS del contador: SIN políticas a propósito (solo la función DEFINER lo toca).
ALTER TABLE folio_abono_seq ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- VERIFICACIÓN (opcional, correr a mano — cada llamada CONSUME un folio)
-- =====================================================
-- SELECT siguiente_folio_abono();   -- AB-AAAA-MM-001 la 1ª vez del mes
-- SELECT * FROM folio_abono_seq;

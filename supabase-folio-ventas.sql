-- =====================================================
-- FASE 12: FOLIO DE OPERACIÓN EN VENTAS (recibos históricos)
-- =====================================================
-- Un folio general por operación de venta (el carrito), estampado en todas
-- las líneas (ventas) de esa operación, para: regenerar el recibo, buscar por
-- folio, y agrupar el historial del cliente en Balance.
-- Formato: BSIN-AAAA-MM-NNN  (prefijo fijo BSIN; NNN reinicia cada mes).
-- Script idempotente.

-- 1. Columna en ventas (aditiva, nullable: ventas viejas quedan sin folio)
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS folio_operacion TEXT;

-- Índice para el buscador rápido por folio
CREATE INDEX IF NOT EXISTS idx_ventas_folio_operacion ON ventas(folio_operacion);

-- 2. Contador por (año, mes) — el consecutivo reinicia cada mes
CREATE TABLE IF NOT EXISTS folio_ventas_seq (
  anio INTEGER NOT NULL,
  mes  INTEGER NOT NULL,
  ultimo INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (anio, mes)
);

-- 3. Función que entrega el siguiente folio de forma ATÓMICA.
--    SECURITY DEFINER para escribir el contador aunque la tabla tenga RLS.
--    El carrito inserta N filas que comparten ESTE folio, por eso se genera
--    una sola vez en JS (vía rpc) y se estampa en todas las líneas.
CREATE OR REPLACE FUNCTION siguiente_folio_venta()
RETURNS TEXT AS $$
DECLARE
  v_anio INTEGER := EXTRACT(YEAR  FROM CURRENT_DATE)::INTEGER;
  v_mes  INTEGER := EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER;
  v_next INTEGER;
BEGIN
  INSERT INTO folio_ventas_seq (anio, mes, ultimo)
  VALUES (v_anio, v_mes, 1)
  ON CONFLICT (anio, mes) DO UPDATE SET ultimo = folio_ventas_seq.ultimo + 1
  RETURNING ultimo INTO v_next;

  RETURN 'BSIN-' || v_anio || '-' || LPAD(v_mes::TEXT, 2, '0') || '-' || LPAD(v_next::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION siguiente_folio_venta() TO authenticated;

-- 4. RLS del contador: SIN políticas a propósito (solo la función DEFINER lo toca).
ALTER TABLE folio_ventas_seq ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- VERIFICACIÓN (opcional, correr a mano)
-- =====================================================
-- SELECT siguiente_folio_venta();          -- debe devolver BSIN-AAAA-MM-001 la 1ª vez del mes
-- SELECT siguiente_folio_venta();          -- BSIN-AAAA-MM-002
-- SELECT * FROM folio_ventas_seq;
-- (OJO: cada llamada CONSUME un folio; correr solo para probar.)

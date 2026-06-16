-- =====================================================
-- COTIZACIONES → VENTA: trazabilidad de conversión
-- =====================================================
-- Sella la cotización cuando se convierte en venta real (registrarVentaMultiple).
-- Sirve para: (1) bloquear una segunda conversión que duplicaría stock,
--             (2) mostrar en la UI "✓ Venta BSIN-..." en vez del botón.
-- Script idempotente (se puede correr varias veces).

ALTER TABLE cotizaciones
  ADD COLUMN IF NOT EXISTS venta_folio   TEXT,        -- folio de la venta generada (BSIN-AAAA-MM-NNN)
  ADD COLUMN IF NOT EXISTS convertida_at TIMESTAMPTZ; -- cuándo se convirtió

-- =====================================================
-- VERIFICACIÓN (opcional, correr a mano)
-- =====================================================
-- SELECT folio, estado, venta_folio, convertida_at
--   FROM cotizaciones
--  WHERE venta_folio IS NOT NULL
--  ORDER BY convertida_at DESC;

-- =====================================================
-- FASE 7 — Plantillas dinámicas (enfoque HÍBRIDO)
-- =====================================================
-- Objetivo: que `configuraciones_corte` sirva para CUALQUIER tipo de
-- producto manufacturado (sábanas, totebags, cortinas...), no solo sábanas.
--
-- Estrategia (acordada con Rigo 2026-05-28):
--   • ADITIVO: agregamos `medidas_json JSONB`. NO borramos las columnas
--     hardcoded de sábana (metros_sabana_plana, etc.) — quedan como
--     respaldo. Limpieza posterior en Sub-Fase 5.E.
--   • TRIGGER en Postgres recalcula `total_metros_lineales` con FALLBACK DUAL:
--       1) si hay medidas_json → suma metros de las piezas incluidas
--       2) si NO → usa el modelo legacy (columnas de sábana)
--
-- SEGURIDAD: la app Streamlit read-only (/Produccion/db.py) SOLO lee
-- columnas de costo (costo_confeccion, costo_empaque, costo_material,
-- costo_total, nombre, producto_id, variante_id, es_configuracion_actual,
-- activo, fecha_vigencia). Esta migración NO toca esas columnas → la
-- Streamlit queda intacta.
--
-- Idempotente: se puede correr varias veces sin daño.
-- Correr en: SQL Editor de Supabase.
-- =====================================================

-- =====================================================
-- 1. NUEVA COLUMNA: medidas_json
-- =====================================================
-- Estructura esperada (array de piezas):
--   [
--     {"pieza": "Sábana plana",     "metros": 2.50, "cantidad": 1, "incluir": true},
--     {"pieza": "Sábana de cajón",  "metros": 2.80, "cantidad": 1, "incluir": true},
--     {"pieza": "Fundas",           "metros": 0.45, "cantidad": 2, "incluir": true}
--   ]
-- Para un totebag sería p. ej.:
--   [{"pieza": "Cuerpo", "metros": 0.60, "cantidad": 1, "incluir": true},
--    {"pieza": "Asas",   "metros": 0.20, "cantidad": 2, "incluir": true}]
ALTER TABLE configuraciones_corte
  ADD COLUMN IF NOT EXISTS medidas_json JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN configuraciones_corte.medidas_json IS
  'Fase 7: piezas/geometría específicas del tipo de producto. '
  'Array de {pieza, metros, cantidad, incluir}. Reemplaza dinámicamente '
  'a las columnas hardcoded de sábana (metros_sabana_*). Si está vacío, '
  'el trigger usa fallback al modelo legacy.';

-- =====================================================
-- 2. BACKFILL: migrar configs de sábana existentes al JSON
-- =====================================================
-- Solo toca filas que (a) aún no tienen medidas_json y (b) son configs
-- reales de sábana (algún metros_* > 0). NO toca filas ya migradas.
UPDATE configuraciones_corte cc
SET medidas_json = (
  SELECT COALESCE(jsonb_agg(pieza), '[]'::jsonb)
  FROM (
    SELECT jsonb_build_object(
             'pieza',    'Sábana plana',
             'metros',   COALESCE(cc.metros_sabana_plana, 0),
             'cantidad', 1,
             'incluir',  COALESCE(cc.incluye_sabana_plana, false)
           ) AS pieza
    WHERE COALESCE(cc.metros_sabana_plana, 0) > 0

    UNION ALL
    SELECT jsonb_build_object(
             'pieza',    'Sábana de cajón',
             'metros',   COALESCE(cc.metros_sabana_cajon, 0),
             'cantidad', 1,
             'incluir',  COALESCE(cc.incluye_sabana_cajon, false)
           )
    WHERE COALESCE(cc.metros_sabana_cajon, 0) > 0

    UNION ALL
    SELECT jsonb_build_object(
             'pieza',    'Funda',
             'metros',   COALESCE(cc.metros_fundas, 0),
             'cantidad', COALESCE(cc.cantidad_fundas, 1),
             'incluir',  COALESCE(cc.incluye_fundas, false)
           )
    WHERE COALESCE(cc.metros_fundas, 0) > 0
  ) piezas
)
WHERE (cc.medidas_json IS NULL OR cc.medidas_json = '[]'::jsonb)
  AND (
        COALESCE(cc.metros_sabana_plana, 0) > 0
     OR COALESCE(cc.metros_sabana_cajon, 0) > 0
     OR COALESCE(cc.metros_fundas, 0) > 0
  );

-- =====================================================
-- 3. TRIGGER: recálculo con FALLBACK DUAL
-- =====================================================
-- Reemplaza la función de cálculo. Mantiene la firma y el mismo trigger
-- (trigger_calcular_corte BEFORE INSERT OR UPDATE) que ya existe.
CREATE OR REPLACE FUNCTION calcular_configuracion_corte()
RETURNS TRIGGER AS $$
DECLARE
  suma_metros DECIMAL(10,3) := 0;
  pieza JSONB;
BEGIN
  -- (1) MODELO NUEVO: si hay medidas_json con al menos una pieza
  IF NEW.medidas_json IS NOT NULL
     AND jsonb_typeof(NEW.medidas_json) = 'array'
     AND jsonb_array_length(NEW.medidas_json) > 0 THEN

    FOR pieza IN SELECT * FROM jsonb_array_elements(NEW.medidas_json)
    LOOP
      -- 'incluir' default true: solo se excluye si viene explícitamente false
      IF COALESCE((pieza->>'incluir')::BOOLEAN, true) THEN
        suma_metros := suma_metros +
          COALESCE((pieza->>'metros')::DECIMAL, 0) *
          COALESCE((pieza->>'cantidad')::INTEGER, 1);
      END IF;
    END LOOP;

  ELSE
    -- (2) FALLBACK LEGACY: modelo hardcoded de sábana (v2)
    suma_metros := (
      CASE WHEN NEW.incluye_sabana_plana THEN COALESCE(NEW.metros_sabana_plana, 0) ELSE 0 END +
      CASE WHEN NEW.incluye_sabana_cajon THEN COALESCE(NEW.metros_sabana_cajon, 0) ELSE 0 END +
      CASE WHEN NEW.incluye_fundas       THEN COALESCE(NEW.metros_fundas, 0) * COALESCE(NEW.cantidad_fundas, 1) ELSE 0 END
    );
  END IF;

  -- Aplicar desperdicio/merma (común a ambos modelos)
  NEW.total_metros_lineales := suma_metros * (1 + COALESCE(NEW.porcentaje_desperdicio, 0) / 100);

  -- Costo de material y costo total (sin cambios respecto a v2)
  NEW.costo_material := NEW.total_metros_lineales * COALESCE(NEW.precio_tela_metro, 0);
  NEW.costo_total := COALESCE(NEW.costo_material, 0) +
                     COALESCE(NEW.costo_confeccion, 0) +
                     COALESCE(NEW.costo_empaque, 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- El trigger ya existe (trigger_calcular_corte); no hace falta recrearlo.
-- Lo recreamos por si esta migración corre en un entorno limpio:
DROP TRIGGER IF EXISTS trigger_calcular_corte ON configuraciones_corte;
CREATE TRIGGER trigger_calcular_corte
  BEFORE INSERT OR UPDATE ON configuraciones_corte
  FOR EACH ROW EXECUTE FUNCTION calcular_configuracion_corte();

-- =====================================================
-- 4. RE-DISPARAR el cálculo en filas migradas
-- =====================================================
-- Un UPDATE no-op fuerza al trigger a recalcular usando el medidas_json
-- recién poblado (verifica que el nuevo modelo da el mismo resultado).
UPDATE configuraciones_corte
SET updated_at = NOW()
WHERE medidas_json IS NOT NULL
  AND jsonb_array_length(medidas_json) > 0;

-- =====================================================
-- 5. VERIFICACIÓN (correr a mano y comparar)
-- =====================================================
-- Comparar metros calculados por ambos modelos en configs migradas:
-- SELECT id, nombre, medidas_json,
--        total_metros_lineales, costo_material, costo_total
-- FROM configuraciones_corte
-- WHERE jsonb_array_length(medidas_json) > 0
-- ORDER BY id;

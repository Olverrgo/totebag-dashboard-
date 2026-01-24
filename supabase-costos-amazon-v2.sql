-- =====================================================
-- MIGRACION V2: Agregar campo volumenes_mayoreo
-- =====================================================
-- Ejecutar en: Supabase > SQL Editor > New Query
-- NOTA: Ejecutar DESPUES de supabase-costos-amazon.sql
-- =====================================================

-- Agregar columna para volúmenes de mayoreo (JSON)
ALTER TABLE costos_amazon
ADD COLUMN IF NOT EXISTS volumenes_mayoreo JSONB DEFAULT '[
  {"cantidad": 20, "descuento": 0, "segmento": "Mínimo"},
  {"cantidad": 30, "descuento": 3, "segmento": "Inicial"},
  {"cantidad": 40, "descuento": 5, "segmento": "Básico"},
  {"cantidad": 50, "descuento": 8, "segmento": "Estándar"},
  {"cantidad": 60, "descuento": 10, "segmento": "Preferente"},
  {"cantidad": 70, "descuento": 12, "segmento": "Frecuente"},
  {"cantidad": 80, "descuento": 14, "segmento": "Premium"},
  {"cantidad": 100, "descuento": 16, "segmento": "Distribuidor"},
  {"cantidad": 150, "descuento": 20, "segmento": "Mayorista"}
]'::jsonb;

-- Actualizar precio base mayoreo a 24.50
UPDATE costos_amazon
SET precio_base_mayoreo = 24.50
WHERE precio_base_mayoreo = 45;

-- =====================================================
-- FIN DE LA MIGRACION V2
-- =====================================================

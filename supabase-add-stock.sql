-- =====================================================
-- MIGRACION: Agregar campos de Stock a productos
-- =====================================================
-- Ejecutar en: Supabase > SQL Editor > New Query
-- =====================================================

-- Agregar campo stock (inventario en taller)
ALTER TABLE productos
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;

-- Agregar campo stock_consignacion (inventario en consignacion)
ALTER TABLE productos
ADD COLUMN IF NOT EXISTS stock_consignacion INTEGER DEFAULT 0;

-- Agregar campo costo_total_4_tintas si no existe
ALTER TABLE productos
ADD COLUMN IF NOT EXISTS costo_total_4_tintas DECIMAL(10,2) DEFAULT 0;

-- Agregar campo tipo_entrega si no existe
ALTER TABLE productos
ADD COLUMN IF NOT EXISTS tipo_entrega VARCHAR(20) DEFAULT 'envio';

-- Agregar campo serigrafia_4_tintas si no existe
ALTER TABLE productos
ADD COLUMN IF NOT EXISTS serigrafia_4_tintas DECIMAL(10,2) DEFAULT 0;

-- Indices para optimizar consultas de stock
CREATE INDEX IF NOT EXISTS idx_productos_stock ON productos(stock);
CREATE INDEX IF NOT EXISTS idx_productos_stock_consignacion ON productos(stock_consignacion);

-- =====================================================
-- FIN DE LA MIGRACION
-- =====================================================

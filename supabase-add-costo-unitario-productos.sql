-- =====================================================
-- AGREGAR costo_unitario A TABLA productos
-- =====================================================
-- Necesario para completarOrdenProduccion:
-- La función calcula el costo promedio ponderado al completar
-- una orden y lo propaga al producto/variante.
--
-- La tabla variantes_producto ya tiene costo_unitario,
-- pero productos no lo tenía.
-- =====================================================

ALTER TABLE productos
ADD COLUMN IF NOT EXISTS costo_unitario DECIMAL(10,2) DEFAULT 0;

-- Opcional: inicializar costo_unitario con costo_total_1_tinta como referencia base
-- UPDATE productos SET costo_unitario = costo_total_1_tinta WHERE costo_unitario = 0 AND costo_total_1_tinta > 0;

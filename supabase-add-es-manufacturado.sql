-- ============================================================
-- Fase 1: Clasificación Manufactura vs Reventa
--
-- Agrega columna productos.es_manufacturado (boolean) para
-- distinguir productos fabricados internamente de los que solo
-- se revenden, INDEPENDIENTE de la categoría.
--
-- Reemplaza la lógica actual `esCategoriaLegacy()` (Dashboard.jsx:
-- 2569) que hardcodea como manufactura solo a la categoría
-- 'totebags', dejando fuera a Ropa de Cama, Cortinas, etc.
--
-- Plan completo: ver AGENTES.md sección
-- "Plan de Implementación: Manufactura vs Reventa".
--
-- Idempotente: ejecutar UNA vez en SQL Editor de Supabase.
--   https://supabase.com/dashboard/project/xaacdoacjzjjvldgovxs/sql/new
-- ============================================================


-- ------------------------------------------------------------
-- 0. (OPCIONAL — recomendado antes de correr el script)
--    Verificar slugs de categorías existentes.
--
--    El backfill del paso 2 asume estos slugs:
--      'totebags', 'ropa-de-cama', 'cortinas'
--    Si los slugs reales son distintos (ej. 'ropa_de_cama' o
--    'sabanas'), ajusta el IN(...) del paso 2 antes de correr.
-- ------------------------------------------------------------
-- select id, slug, nombre from categorias order by nombre;


-- ------------------------------------------------------------
-- 1. AGREGAR COLUMNA
--    Default `false` porque la mayoría de productos nuevos serán
--    reventa. El usuario activa el toggle si aplica.
--    Idempotente: `if not exists` evita romper en re-ejecuciones.
-- ------------------------------------------------------------
alter table productos
  add column if not exists es_manufacturado boolean not null default false;


-- ------------------------------------------------------------
-- 2. BACKFILL — marcar productos manufacturados existentes
--
--    Reglas confirmadas por Rigo (sesión 2026-05-27):
--      • Totebags (Bolsas de Manta) → fabrica
--      • Ropa de Cama / Sábanas (Sinai Hogar) → fabrica
--      • Cortinas → fabrica
--      • Resto (Botanas, Dulces, Cerveza, Ropa de baño) → reventa
--
--    Productos individuales podrán cambiarse después vía el
--    toggle en el formulario (Fase 2, a cargo de Gemini).
-- ------------------------------------------------------------
update productos
   set es_manufacturado = true
 where categoria_id in (
   select id from categorias
    where slug in ('totebags', 'ropa-de-cama', 'cortinas')
 );


-- ------------------------------------------------------------
-- 3. VERIFICACIÓN
--    Después de correr este script, descomenta y ejecuta este
--    SELECT para confirmar que el backfill quedó correcto:
--    cuántos productos manufactura/reventa por categoría.
-- ------------------------------------------------------------
-- select
--   c.slug                                          as categoria,
--   c.nombre,
--   count(*) filter (where p.es_manufacturado)      as manufacturados,
--   count(*) filter (where not p.es_manufacturado)  as reventa,
--   count(*)                                        as total
--   from productos p
--   left join categorias c on c.id = p.categoria_id
--  group by c.slug, c.nombre
--  order by c.nombre;

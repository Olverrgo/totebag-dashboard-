-- ============================================================
-- Sub-Fase 5.A: Schema refactor para "Receta Viva"
--
-- Objetivo: que la RECETA (tabla `recetas` + `materiales` +
-- `configuraciones_corte`) sea la fuente única de verdad para
-- el costo de un producto manufactura, permitiendo además que
-- distintas variantes del mismo producto tengan distintas
-- recetas/materiales si aplica.
--
-- Cambios:
--   1. recetas.variante_id (NULLABLE) → permite recetas
--      específicas por variante. NULL = aplica a todas las variantes
--   2. recetas.opcional → marca materiales alternativos
--      (resuelve el patrón "Disperso/Polish/estampado" donde solo
--      uno se usa por orden)
--   3. recetas UNIQUE constraint actualizado:
--      (producto_id, material_id) → (producto_id, variante_id, material_id)
--   4. configuraciones_corte.material_id (NULLABLE) → la tela
--      específica del corte (FK a `materiales`). El precio se
--      lee dinámicamente desde materiales.costo_unitario.
--   5. configuraciones_corte.precio_tela_metro marcado deprecated
--      (queda físicamente, ya no se usa en lógica nueva)
--
-- Idempotente: se puede correr varias veces sin romper nada.
--
-- Plan completo: ver AGENTES.md sección
--   "Plan Detallado Fase 5: Sub-Fases A-E"
--
-- Ejecutar UNA vez en SQL Editor de Supabase:
--   https://supabase.com/dashboard/project/xaacdoacjzjjvldgovxs/sql/new
-- ============================================================


-- ------------------------------------------------------------
-- 1. RECETAS: agregar variante_id (nullable)
--    NULL = la receta aplica a todas las variantes del producto
--    (fallback / receta base). Si una variante específica tiene
--    su propia entrada, esa tiene prioridad sobre la NULL.
-- ------------------------------------------------------------
alter table recetas
  add column if not exists variante_id integer references variantes_producto(id) on delete cascade;


-- ------------------------------------------------------------
-- 2. RECETAS: agregar opcional (default false)
--    Para materiales alternativos. Ej. Sábana puede usar
--    Disperso O Polish O polish estampado (cualquiera) — los 3
--    están en receta pero todos con opcional=true. En el wizard
--    aparecen atenuados; el usuario activa el que va a usar.
-- ------------------------------------------------------------
alter table recetas
  add column if not exists opcional boolean not null default false;


-- ------------------------------------------------------------
-- 3. RECETAS: actualizar UNIQUE constraint
--    De: (producto_id, material_id)
--    A:  (producto_id, variante_id, material_id)
--
--    PostgreSQL trata múltiples NULL como distintos en UNIQUE,
--    así que puedes tener varias filas con variante_id=NULL para
--    distintos material_id del mismo producto (que era el
--    comportamiento anterior).
--
--    Si la variante tiene su propia receta (variante_id no NULL),
--    también puedes tener una entrada NULL al mismo tiempo —
--    la lógica de la app decide cuál usar.
-- ------------------------------------------------------------
do $$
declare
  cname text;
begin
  -- Drop el constraint UNIQUE viejo (2 columnas) si existe
  for cname in
    select conname from pg_constraint
    where conrelid = 'recetas'::regclass
      and contype = 'u'
      and conname <> 'recetas_producto_variante_material_unique'
      and array_length(conkey, 1) = 2
  loop
    execute format('alter table recetas drop constraint %I', cname);
  end loop;

  -- Add el nuevo constraint (3 columnas) si no existe
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'recetas'::regclass
      and conname = 'recetas_producto_variante_material_unique'
  ) then
    alter table recetas
      add constraint recetas_producto_variante_material_unique
      unique (producto_id, variante_id, material_id);
  end if;
end $$;


-- ------------------------------------------------------------
-- 4. CONFIGURACIONES_CORTE: agregar material_id (nullable)
--    Apunta a la tela específica que se usa en este corte.
--    El precio se lee de materiales.costo_unitario en tiempo
--    real → no más desincronización.
--
--    NULLABLE inicialmente para no romper configs existentes.
--    Rigo migrará manualmente cada config para apuntar al
--    material correcto (no se puede hacer automáticamente desde
--    precio_tela_metro porque no sabemos qué material es).
-- ------------------------------------------------------------
alter table configuraciones_corte
  add column if not exists material_id uuid references materiales(id);


-- ------------------------------------------------------------
-- 5. Marcar columnas obsoletas en configuraciones_corte
--    (deprecated en comentario, NO se eliminan físicamente —
--    se mantienen por compatibilidad mientras migramos. Sub-Fase
--    5.E las eliminará después de 1-2 semanas de uso real.)
-- ------------------------------------------------------------
comment on column configuraciones_corte.precio_tela_metro is
  'DEPRECATED — Sub-Fase 5.A. Usar material_id y leer materiales.costo_unitario. Mantiene compatibilidad con configs existentes hasta que Rigo migre cada una.';

comment on column configuraciones_corte.costo_material is
  'DEPRECATED — Sub-Fase 5.A. Calcular en tiempo real desde receta + material.costo_unitario.';

comment on column configuraciones_corte.costo_total is
  'DEPRECATED — Sub-Fase 5.A. Calcular en tiempo real: materiales + costo_confeccion + costo_empaque.';


-- ------------------------------------------------------------
-- 6. VERIFICACIÓN
--    Confirma que las columnas nuevas existen.
-- ------------------------------------------------------------
-- Después de correr el script, descomenta y ejecuta esta query
-- para verificar que los cambios quedaron:
--
-- select
--   table_name,
--   column_name,
--   data_type,
--   is_nullable,
--   column_default
--   from information_schema.columns
--  where (table_name = 'recetas' and column_name in ('variante_id', 'opcional'))
--     or (table_name = 'configuraciones_corte' and column_name = 'material_id')
--  order by table_name, column_name;
--
-- Esperado: 3 filas
--   configuraciones_corte | material_id | uuid    | YES
--   recetas               | opcional    | boolean | NO  (default false)
--   recetas               | variante_id | integer | YES

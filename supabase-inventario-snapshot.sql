-- ============================================================================
-- SNAPSHOT DIARIO DE INVENTARIO
-- ----------------------------------------------------------------------------
-- Objetivo: guardar una "foto" del inventario cada día para ver su evolución
-- en el tiempo (cómo crece el colchón en bodega, efecto de la ayuda de empaque,
-- ritmo de colocación). La base hoy solo tiene EVENTOS (movimientos_stock,
-- ordenes_produccion); esto agrega el NIVEL diario, sin reconstruir ni drift.
--
-- Idempotente: se puede correr varias veces. La función hace UPSERT por fecha.
-- ============================================================================

-- 1) Tabla de snapshots --------------------------------------------------------
create table if not exists inventario_snapshot_diario (
  id            uuid primary key default gen_random_uuid(),
  fecha         date not null unique,
  stock_bodega  integer not null default 0,   -- piezas disponibles en bodega
  consignacion  integer not null default 0,   -- piezas en la calle (consignación)
  total         integer not null default 0,   -- bodega + consignación
  por_categoria jsonb,                         -- { "Ropa de Cama": {bodega, consignacion}, ... }
  created_at    timestamptz default now()
);

comment on table inventario_snapshot_diario is
  'Foto diaria del inventario (bodega + consignación). Poblada por capturar_snapshot_inventario().';

-- 2) Función que captura la foto de HOY (o de una fecha dada) -------------------
-- Maneja productos con variantes (suma variantes_producto) y sin variantes
-- (usa productos.stock / stock_consignacion), igual que la app.
-- OJO ZONA HORARIA: el default usa fecha de CDMX (no UTC) para evitar el
-- desfase -6 que feharía la foto al día siguiente si se corre de noche.
create or replace function capturar_snapshot_inventario(
  p_fecha date default (now() at time zone 'America/Mexico_City')::date
)
returns inventario_snapshot_diario
language plpgsql
as $$
declare
  v_row inventario_snapshot_diario;
begin
  with base as (
    select
      p.id,
      coalesce(c.nombre, 'Sin categoría') as categoria,
      case when v.producto_id is not null then v.vs else coalesce(p.stock, 0) end            as bodega,
      case when v.producto_id is not null then v.vc else coalesce(p.stock_consignacion, 0) end as consig
    from productos p
    left join categorias c on c.id = p.categoria_id
    left join (
      select producto_id,
             sum(coalesce(stock, 0))              as vs,
             sum(coalesce(stock_consignacion, 0)) as vc
      from variantes_producto
      where activo = true
      group by producto_id
    ) v on v.producto_id = p.id
    where p.activo = true
  ),
  por_cat as (
    select categoria,
           sum(bodega) as bodega,
           sum(consig) as consig
    from base
    group by categoria
  )
  insert into inventario_snapshot_diario (fecha, stock_bodega, consignacion, total, por_categoria)
  select
    p_fecha,
    coalesce((select sum(bodega) from base), 0),
    coalesce((select sum(consig) from base), 0),
    coalesce((select sum(bodega + consig) from base), 0),
    (select jsonb_object_agg(categoria, jsonb_build_object('bodega', bodega, 'consignacion', consig))
       from por_cat)
  on conflict (fecha) do update set
    stock_bodega  = excluded.stock_bodega,
    consignacion  = excluded.consignacion,
    total         = excluded.total,
    por_categoria = excluded.por_categoria,
    created_at    = now()
  returning * into v_row;

  return v_row;
end;
$$;

-- 3) Captura la foto de hoy de una vez (para no arrancar la serie vacía) --------
select capturar_snapshot_inventario();

-- ============================================================================
-- 4) Foto diaria automática con pg_cron (APLICADO 2026-06-29)
--    Corre cada noche a las 23:50 CDMX. Idempotente: re-programa si ya existe.
-- ============================================================================
create extension if not exists pg_cron;

select cron.unschedule('snapshot-inventario-diario')
where exists (select 1 from cron.job where jobname = 'snapshot-inventario-diario');

select cron.schedule(
  'snapshot-inventario-diario',
  '50 5 * * *',                       -- 05:50 UTC = 23:50 CDMX (UTC-6)
  $$ select capturar_snapshot_inventario(); $$
);

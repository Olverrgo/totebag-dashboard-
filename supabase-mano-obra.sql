-- ============================================================================
-- MÓDULO MANO DE OBRA — registro de tiempo/producción por persona
-- ----------------------------------------------------------------------------
-- Objetivo: capturar el costo real de la mano de obra y la productividad de
-- cada colaborador (hoy Alejandra: doblar+empacar), proyectable a más personas.
--
-- Decisiones de Rigo (2026-06-30):
--   • Pago MIXTO: cada registro se paga por HORA o por PIEZA (se elige por registro).
--   • Trabajo LIGADO a orden de producción (trazabilidad con lo que ya existe).
--   • Tareas de arranque: doblar+empacar, cortar, coser, planchar/acabado.
--
-- RLS: CRUD para `authenticated` (mismo patrón que ordenes_produccion).
-- Idempotente donde se puede (IF NOT EXISTS / ON CONFLICT).
-- ============================================================================

-- 1) COLABORADORES -----------------------------------------------------------
create table if not exists colaboradores (
  id           uuid primary key default gen_random_uuid(),
  nombre       text not null,
  rol          text,                 -- 'empaque','corte','costura','acabado','multi'
  tarifa_hora  numeric default 0,    -- $/hora (para registros por hora)
  tarifa_pieza numeric default 0,    -- $/pieza (para registros por pieza)
  activo       boolean default true,
  fecha_alta   date default (now() at time zone 'America/Mexico_City')::date,
  notas        text,
  created_at   timestamptz default now()
);
comment on table colaboradores is 'Personas del equipo (mano de obra). Tarifas base por hora y por pieza.';

-- 2) CATÁLOGO DE TAREAS ------------------------------------------------------
create table if not exists tareas_trabajo (
  id                 uuid primary key default gen_random_uuid(),
  nombre             text not null,
  slug               text unique not null,
  modalidad_sugerida text check (modalidad_sugerida in ('hora','pieza')) default 'pieza',
  unidad             text default 'pieza',     -- 'pieza','juego','metro'
  activo             boolean default true,
  orden              int default 0
);
comment on table tareas_trabajo is 'Catálogo de tareas (doblar, cortar, coser, planchar...).';

-- 3) REGISTROS DE TRABAJO (corazón del módulo) -------------------------------
create table if not exists registros_trabajo (
  id                  uuid primary key default gen_random_uuid(),
  colaborador_id      uuid not null references colaboradores(id) on delete restrict,
  tarea_id            uuid references tareas_trabajo(id),
  orden_produccion_id uuid references ordenes_produccion(id) on delete set null,
  producto_id         integer references productos(id),
  variante_id         integer references variantes_producto(id),
  fecha               date not null default (now() at time zone 'America/Mexico_City')::date,
  hora_inicio         time,
  hora_fin            time,
  horas               numeric default 0,        -- horas trabajadas (manual o derivada)
  cantidad            numeric default 0,        -- piezas producidas
  modalidad           text not null check (modalidad in ('hora','pieza')),
  tarifa_aplicada     numeric not null default 0,  -- snapshot de la tarifa usada
  -- costo calculado automáticamente según la modalidad del registro
  costo numeric generated always as (
    case when modalidad = 'hora'
         then coalesce(horas,0)    * coalesce(tarifa_aplicada,0)
         else coalesce(cantidad,0) * coalesce(tarifa_aplicada,0)
    end
  ) stored,
  pagado     boolean default false,
  fecha_pago date,
  notas      text,
  created_at timestamptz default now()
);
comment on table registros_trabajo is 'Una fila por sesión de trabajo: persona, tarea, horas/piezas y costo.';

create index if not exists idx_regtrab_colab_fecha on registros_trabajo (colaborador_id, fecha);
create index if not exists idx_regtrab_fecha        on registros_trabajo (fecha);
create index if not exists idx_regtrab_orden        on registros_trabajo (orden_produccion_id);

-- 4) RLS (CRUD para authenticated, igual que ordenes_produccion) -------------
alter table colaboradores      enable row level security;
alter table tareas_trabajo     enable row level security;
alter table registros_trabajo  enable row level security;

do $$
declare t text;
begin
  foreach t in array array['colaboradores','tareas_trabajo','registros_trabajo'] loop
    execute format('drop policy if exists %1$s_select on %1$s', t);
    execute format('drop policy if exists %1$s_insert on %1$s', t);
    execute format('drop policy if exists %1$s_update on %1$s', t);
    execute format('drop policy if exists %1$s_delete on %1$s', t);
    execute format('create policy %1$s_select on %1$s for select to authenticated using (true)', t);
    execute format('create policy %1$s_insert on %1$s for insert to authenticated with check (true)', t);
    execute format('create policy %1$s_update on %1$s for update to authenticated using (true) with check (true)', t);
    execute format('create policy %1$s_delete on %1$s for delete to authenticated using (true)', t);
  end loop;
end $$;

-- 5) SEED de tareas ----------------------------------------------------------
insert into tareas_trabajo (nombre, slug, modalidad_sugerida, unidad, orden) values
  ('Doblar y empacar',   'doblar-empacar', 'pieza', 'pieza', 1),
  ('Cortar',             'cortar',         'pieza', 'pieza', 2),
  ('Coser / confeccionar','coser',         'pieza', 'pieza', 3),
  ('Planchar / acabado', 'planchar',       'hora',  'pieza', 4)
on conflict (slug) do nothing;

-- 6) SEED del primer colaborador (Alejandra) — define su tarifa_hora real -----
insert into colaboradores (nombre, rol, tarifa_hora, notas)
select 'Alejandra', 'empaque', 0,
       'Primer apoyo (doblar+empacar). DEFINIR tarifa_hora real.'
where not exists (select 1 from colaboradores where nombre = 'Alejandra');

-- 7) VISTA de análisis: costo + productividad por persona/día/tarea ----------
create or replace view v_mano_obra as
select
  r.fecha,
  r.colaborador_id,
  c.nombre              as colaborador,
  t.nombre              as tarea,
  sum(r.horas)          as horas,
  sum(r.cantidad)       as piezas,
  sum(r.costo)          as costo,
  case when sum(r.horas) > 0
       then round(sum(r.cantidad) / sum(r.horas), 2) end as piezas_por_hora,
  case when sum(r.cantidad) > 0
       then round(sum(r.costo) / sum(r.cantidad), 2) end as costo_por_pieza
from registros_trabajo r
join colaboradores c on c.id = r.colaborador_id
left join tareas_trabajo t on t.id = r.tarea_id
group by r.fecha, r.colaborador_id, c.nombre, t.nombre;
comment on view v_mano_obra is 'Resumen diario de mano de obra: horas, piezas, costo, productividad y costo/pieza.';

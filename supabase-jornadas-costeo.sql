-- ============================================================================
-- RELOJ CHECADOR (jornadas) + COSTEO REAL POR PROCESO
-- ----------------------------------------------------------------------------
-- Extiende el módulo de Mano de Obra (supabase-mano-obra.sql).
-- Decisiones de Rigo (2026-06-30):
--   • Reloj checador con pausas justificadas (comida/permiso/otro).
--   • Costeo REAL desde horas: costo/pieza = (horas × tarifa) ÷ piezas.
--     → exige capturar PIEZAS aunque el trabajo sea por hora (cambio de UI).
--   • Rigo se registra como colaborador (corta y confecciona).
--   • Jornada olvidada abierta = se corrige a MANO (sin auto-cierre).
-- RLS: CRUD authenticated. Transiciones de estado vía funciones (atómicas).
-- ============================================================================

-- 1) JORNADAS (asistencia) ---------------------------------------------------
create table if not exists jornadas (
  id             uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references colaboradores(id) on delete restrict,
  fecha          date not null default (now() at time zone 'America/Mexico_City')::date,
  inicio         timestamptz not null default now(),
  fin            timestamptz,
  estado         text not null default 'activa' check (estado in ('activa','pausada','cerrada')),
  notas          text,
  created_at     timestamptz default now()
);

create table if not exists jornada_pausas (
  id            uuid primary key default gen_random_uuid(),
  jornada_id    uuid not null references jornadas(id) on delete cascade,
  tipo          text not null check (tipo in ('comida','permiso','otro')),
  inicio        timestamptz not null default now(),
  fin           timestamptz,
  justificacion text,
  created_at    timestamptz default now()
);

create index if not exists idx_jornadas_colab on jornadas(colaborador_id, fecha);
create index if not exists idx_pausas_jornada on jornada_pausas(jornada_id);

-- 2) RLS (CRUD authenticated) ------------------------------------------------
alter table jornadas      enable row level security;
alter table jornada_pausas enable row level security;
do $$ declare t text; begin
  foreach t in array array['jornadas','jornada_pausas'] loop
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

-- 3) FUNCIONES de estado (atómicas) ------------------------------------------
create or replace function iniciar_jornada(p_colaborador uuid)
returns jornadas language plpgsql as $$
declare v jornadas;
begin
  if exists (select 1 from jornadas where colaborador_id = p_colaborador and estado <> 'cerrada') then
    raise exception 'El colaborador ya tiene una jornada abierta';
  end if;
  insert into jornadas (colaborador_id) values (p_colaborador) returning * into v;
  return v;
end $$;

create or replace function pausar_jornada(p_jornada uuid, p_tipo text, p_justif text default null)
returns void language plpgsql as $$
begin
  update jornada_pausas set fin = now() where jornada_id = p_jornada and fin is null; -- seguridad
  insert into jornada_pausas (jornada_id, tipo, justificacion) values (p_jornada, p_tipo, p_justif);
  update jornadas set estado = 'pausada' where id = p_jornada;
end $$;

create or replace function reanudar_jornada(p_jornada uuid)
returns void language plpgsql as $$
begin
  update jornada_pausas set fin = now() where jornada_id = p_jornada and fin is null;
  update jornadas set estado = 'activa' where id = p_jornada;
end $$;

create or replace function cerrar_jornada(p_jornada uuid)
returns jornadas language plpgsql as $$
declare v jornadas;
begin
  update jornada_pausas set fin = now() where jornada_id = p_jornada and fin is null;
  update jornadas set fin = now(), estado = 'cerrada' where id = p_jornada returning * into v;
  return v;
end $$;

-- 4) VISTA de jornadas con horas netas (brutas − pausas) ----------------------
-- Para jornada/pausa abierta usa now() → el cronómetro corre en vivo.
create or replace view v_jornadas as
select
  j.id, j.colaborador_id, c.nombre as colaborador, j.fecha, j.inicio, j.fin, j.estado, j.notas,
  round(extract(epoch from (coalesce(j.fin, now()) - j.inicio))/3600.0, 2) as horas_brutas,
  coalesce((select round(sum(extract(epoch from (coalesce(p.fin, now()) - p.inicio)))/3600.0, 2)
            from jornada_pausas p where p.jornada_id = j.id), 0) as horas_pausa,
  round(
    extract(epoch from (coalesce(j.fin, now()) - j.inicio))/3600.0
    - coalesce((select sum(extract(epoch from (coalesce(p.fin, now()) - p.inicio)))/3600.0
                from jornada_pausas p where p.jornada_id = j.id), 0)
  , 2) as horas_netas
from jornadas j
join colaboradores c on c.id = j.colaborador_id;

-- 5) COSTEO REAL POR PROCESO -------------------------------------------------
-- costo/pieza de cada proceso = Σcosto ÷ Σpiezas (necesita piezas en cada registro).
create or replace view v_costo_proceso as
select
  coalesce(r.producto_id, op.producto_id) as producto_id,
  pr.linea_nombre as producto,
  t.slug  as proceso_slug,
  t.nombre as proceso,
  sum(r.horas)    as horas,
  sum(r.cantidad) as piezas,
  sum(r.costo)    as costo_total,
  case when sum(r.cantidad) > 0 then round(sum(r.costo)/sum(r.cantidad), 2) end as costo_por_pieza
from registros_trabajo r
left join tareas_trabajo t on t.id = r.tarea_id
left join ordenes_produccion op on op.id = r.orden_produccion_id
left join productos pr on pr.id = coalesce(r.producto_id, op.producto_id)
group by coalesce(r.producto_id, op.producto_id), pr.linea_nombre, t.slug, t.nombre;

-- Maquila REAL por producto (suma de procesos) vs el estándar (costo_maquila).
create or replace view v_maquila_producto as
select
  cp.producto_id,
  cp.producto,
  round(sum(cp.costo_por_pieza), 2)                         as maquila_real_por_pieza,
  pr.costo_maquila                                          as maquila_estandar,
  round(sum(cp.costo_por_pieza) - coalesce(pr.costo_maquila,0), 2) as diferencia_vs_estandar
from v_costo_proceso cp
left join productos pr on pr.id = cp.producto_id
where cp.producto_id is not null
group by cp.producto_id, cp.producto, pr.costo_maquila;

-- 6) Registrar a Rigo como colaborador (corta y confecciona) -----------------
insert into colaboradores (nombre, rol, notas)
select 'Rigo', 'multi', 'Dueño/operador: corta y confecciona. DEFINIR tarifa_hora real.'
where not exists (select 1 from colaboradores where nombre = 'Rigo');

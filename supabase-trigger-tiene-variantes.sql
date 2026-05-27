-- ============================================================
-- Trigger: mantener productos.tiene_variantes sincronizado
-- automáticamente con la existencia de variantes ACTIVAS en
-- variantes_producto.
--
-- Contexto:
--   El flag productos.tiene_variantes se usaba como atajo de
--   performance ("¿este producto tiene variantes?" sin tener que
--   contar). Pero el flag no se actualizaba al crear/eliminar/
--   soft-delete variantes desde algunas rutas, quedando out-of-sync.
--   El commit c115866 esquivó el bug consultando getVariantes()
--   siempre en el wizard de producción. Este trigger es el fix
--   definitivo: el flag se mantiene correcto sin importar desde
--   dónde se modifiquen las variantes.
--
-- Cubre:
--   - INSERT de variante       → flag del padre → true
--   - DELETE (hard) de variante → recalcula flag del padre
--   - UPDATE OF activo         → soft-delete / reactivación
--   - UPDATE OF producto_id    → re-asignación (raro, por completitud)
--
-- Definición de "tiene variantes" (alineado con getVariantes):
--   EXISTS variantes con activo = true para ese producto_id.
--
-- Idempotente: se puede correr varias veces sin romper nada.
--
-- Ejecutar UNA vez en SQL Editor de Supabase:
--   https://supabase.com/dashboard/project/xaacdoacjzjjvldgovxs/sql/new
-- ============================================================


-- ------------------------------------------------------------
-- 1. BACKFILL — arreglar el estado actual
-- ------------------------------------------------------------
-- Sincroniza el flag para todos los productos existentes.
-- Filtra por v.activo = true porque la app considera "tiene
-- variantes" como "tiene al menos una variante activa".
update productos p
set tiene_variantes = exists (
  select 1 from variantes_producto v
  where v.producto_id = p.id and v.activo = true
);


-- ------------------------------------------------------------
-- 2. FUNCIÓN DE SINCRONIZACIÓN
-- ------------------------------------------------------------
-- Recalcula el flag del producto afectado.
-- Maneja por separado NEW.producto_id (INSERT/UPDATE) y
-- OLD.producto_id (DELETE/UPDATE con cambio de producto_id),
-- para cubrir el caso raro de mover una variante entre productos.
--
-- SECURITY DEFINER para que el trigger pueda actualizar productos
-- aunque el usuario que originó el INSERT/UPDATE no tenga permiso
-- directo sobre productos (típico con RLS activo).
create or replace function sync_tiene_variantes()
returns trigger as $$
begin
  -- Caso INSERT o UPDATE: recalcular el flag del producto NEW
  if (tg_op in ('INSERT', 'UPDATE')) then
    update productos
       set tiene_variantes = exists (
         select 1 from variantes_producto
         where producto_id = new.producto_id and activo = true
       )
     where id = new.producto_id;
  end if;

  -- Caso DELETE o UPDATE con cambio de producto_id: recalcular
  -- también el flag del producto OLD (el que perdió la variante)
  if (tg_op = 'DELETE')
     or (tg_op = 'UPDATE' and old.producto_id is distinct from new.producto_id) then
    update productos
       set tiene_variantes = exists (
         select 1 from variantes_producto
         where producto_id = old.producto_id and activo = true
       )
     where id = old.producto_id;
  end if;

  if (tg_op = 'DELETE') then
    return old;
  else
    return new;
  end if;
end;
$$ language plpgsql security definer;


-- ------------------------------------------------------------
-- 3. TRIGGER
-- ------------------------------------------------------------
-- Escucha INSERT, DELETE, y UPDATE de las columnas que afectan al
-- flag: `activo` (soft-delete/reactivación) y `producto_id`
-- (re-asignación). Cambios a material/color/talla/sku no disparan
-- el trigger — irrelevantes para el flag, ahorramos overhead.
drop trigger if exists tr_sync_tiene_variantes on variantes_producto;

create trigger tr_sync_tiene_variantes
after insert or delete or update of activo, producto_id
on variantes_producto
for each row execute function sync_tiene_variantes();


-- ------------------------------------------------------------
-- 4. VERIFICACIÓN
-- ------------------------------------------------------------
-- Después de correr el script, esta query DEBE devolver 0 filas.
-- Si devuelve filas, hay productos cuyo flag no coincide con la
-- realidad de sus variantes activas (no debería pasar si el
-- backfill se aplicó correctamente).
--
-- select p.id,
--        p.linea_nombre,
--        p.tiene_variantes                      as flag_actual,
--        exists(
--          select 1 from variantes_producto v
--          where v.producto_id = p.id and v.activo = true
--        )                                       as deberia_ser
--   from productos p
--  where p.tiene_variantes is distinct from exists(
--          select 1 from variantes_producto v
--          where v.producto_id = p.id and v.activo = true
--        );

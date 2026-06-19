-- =====================================================
-- PIN DE SUPERVISOR — autorización para revertir/editar ventas
-- =====================================================
-- Segundo factor para acciones sensibles (reversa de venta) cuando varias personas
-- comparten la cuenta admin. El PIN se guarda HASHEADO (bcrypt) y NUNCA viaja al
-- navegador: el cliente solo llama al RPC verificar_pin_supervisor(pin) que devuelve
-- true/false. La tabla tiene RLS sin políticas → el cliente no puede leer el hash.
-- Idempotente.

create extension if not exists pgcrypto with schema extensions;

create table if not exists config_seguridad (
  clave          text primary key,
  valor_hash     text not null,
  actualizado_at timestamptz default now()
);

alter table config_seguridad enable row level security;
-- Sin políticas para 'authenticated' → el cliente NO puede leer/escribir el hash.
-- El RPC de abajo (SECURITY DEFINER) sí lo lee.

-- ⚠️ CAMBIA 'CAMBIA_ESTE_PIN' por tu PIN real ANTES de correr este script.
insert into config_seguridad (clave, valor_hash)
values ('pin_supervisor', extensions.crypt('CAMBIA_ESTE_PIN', extensions.gen_salt('bf')))
on conflict (clave) do nothing;

create or replace function verificar_pin_supervisor(pin text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_hash text;
begin
  select valor_hash into v_hash from config_seguridad where clave = 'pin_supervisor';
  if v_hash is null then return false; end if;
  return extensions.crypt(pin, v_hash) = v_hash;
end;
$$;

grant execute on function verificar_pin_supervisor(text) to authenticated;

-- =====================================================
-- CAMBIAR EL PIN DESPUÉS (correr a mano cuando quieras)
-- =====================================================
-- update config_seguridad
--    set valor_hash = extensions.crypt('NUEVO_PIN', extensions.gen_salt('bf')),
--        actualizado_at = now()
--  where clave = 'pin_supervisor';

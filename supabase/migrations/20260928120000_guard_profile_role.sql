-- O acesso ao admin agora é decidido por `profiles.role = 'admin'`. Como a RLS
-- deixa cada usuário atualizar a própria linha de `profiles` (a tela de
-- Configurações grava `full_name` com o client da sessão), sem esta trava
-- qualquer usuário logado poderia rodar, no console do navegador,
--   supabase.from('profiles').update({ role: 'admin' }).eq('id', <seu id>)
-- e entrar no admin.
--
-- A trava só barra sessões de usuário final (`authenticated`). O service role
-- (Server Actions do admin) e o SQL Editor continuam podendo trocar o papel.

create or replace function public.guard_profile_role_change()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and auth.role() = 'authenticated' then
    raise exception 'Só um administrador pode alterar o papel de um usuário.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_role_change on public.profiles;

create trigger guard_profile_role_change
  before update of role on public.profiles
  for each row
  execute function public.guard_profile_role_change();

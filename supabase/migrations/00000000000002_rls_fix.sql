-- =====================================================
-- Fix: RLS recursivo em profiles + auth_org_id()
-- =====================================================
-- Antes: auth_org_id() executava SELECT em profiles, que por sua
-- vez disparava a policy "same_org_profiles" que chama auth_org_id()
-- → recursão, função retorna NULL, profile invisível, dashboard
-- redireciona pra /onboarding indefinidamente.

-- 1) auth_org_id() roda como definer (bypassa RLS de profiles).
create or replace function auth_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from profiles where id = auth.uid()
$$;

-- 2) Garante que o usuário sempre consegue ler/atualizar a própria linha.
drop policy if exists "self_profile_select" on profiles;
create policy "self_profile_select" on profiles
  for select using (id = auth.uid());

-- 3) Permite o usuário criar sua própria linha de profile no onboarding.
--    (Hoje o bootstrap usa service_role e bypassa RLS, mas deixa a porta
--    aberta caso algum fluxo cliente precise.)
drop policy if exists "self_profile_insert" on profiles;
create policy "self_profile_insert" on profiles
  for insert with check (id = auth.uid());

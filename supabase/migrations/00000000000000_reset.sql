-- =====================================================
-- RESET — Use APENAS se a migration anterior falhou parcialmente.
-- Apaga TODAS as tabelas, tipos e funções do schema public.
-- NÃO afeta auth.users.
-- =====================================================

drop schema if exists public cascade;
create schema public;
grant all on schema public to postgres, anon, authenticated, service_role;
grant usage on schema public to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;

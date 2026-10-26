-- GobHub · DIAGNOSTICO de seguridad (solo LEE, no cambia nada).
-- Supabase → SQL Editor → pega todo → Run → copia el resultado completo (una sola celda) y mandamelo.
select jsonb_pretty(jsonb_build_object(
  'tablas', (select jsonb_agg(jsonb_build_object('tabla', c.relname, 'rls_activada', c.relrowsecurity, 'rls_forzada', c.relforcerowsecurity) order by c.relname)
             from pg_class c join pg_namespace n on n.oid=c.relnamespace
             where n.nspname='public' and c.relkind='r'),
  'politicas', (select coalesce(jsonb_agg(jsonb_build_object('tabla', tablename, 'nombre', policyname, 'accion', cmd, 'roles', roles, 'usando', qual, 'con_check', with_check) order by tablename, policyname), '[]'::jsonb)
                from pg_policies where schemaname='public'),
  'columnas', (select jsonb_object_agg(table_name, cols) from (
                 select table_name, jsonb_agg(column_name || ':' || data_type || coalesce(' default ' || column_default, '') order by ordinal_position) cols
                 from information_schema.columns
                 where table_schema='public' and table_name in ('catalogo','perfiles','solicitudes','notificaciones','dependencias')
                 group by table_name) t),
  'funciones', (select coalesce(jsonb_agg(jsonb_build_object('nombre', p.proname, 'security_definer', p.prosecdef) order by p.proname), '[]'::jsonb)
                from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'),
  'triggers', (select coalesce(jsonb_agg(jsonb_build_object('tabla', event_object_table, 'trigger', trigger_name)), '[]'::jsonb)
               from information_schema.triggers where trigger_schema='public')
)) as diagnostico;

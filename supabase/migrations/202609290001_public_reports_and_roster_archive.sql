begin;

create table public.system_settings (
  id integer primary key default 1 check (id = 1),
  public_reports_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.system_settings (id, public_reports_enabled)
values (1, false);

create trigger system_settings_set_updated_at
before update on public.system_settings
for each row execute function public.set_updated_at();

alter table public.system_settings enable row level security;
revoke all on public.system_settings from public, anon;
grant select, update on public.system_settings to authenticated;
grant select, update on public.system_settings to service_role;

create policy system_settings_admin_access on public.system_settings
for all to authenticated using ((select public.is_admin()))
with check ((select public.is_admin()));

create table public.annual_report_archives (
  id uuid primary key default gen_random_uuid(),
  academic_year text not null check (academic_year ~ '^[0-9]{4}$'),
  history_xlsx_path text not null,
  history_pdf_path text not null,
  statistics_xlsx_path text not null,
  statistics_pdf_path text not null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.annual_report_archives enable row level security;
revoke all on public.annual_report_archives from public, anon;
grant select, insert on public.annual_report_archives to authenticated;
grant select, insert on public.annual_report_archives to service_role;

create policy annual_report_archives_staff_select on public.annual_report_archives
for select to authenticated using ((select public.is_staff()));
create policy annual_report_archives_admin_insert on public.annual_report_archives
for insert to authenticated with check ((select public.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'annual-report-archives',
  'annual-report-archives',
  false,
  104857600,
  array['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
on conflict (id) do nothing;

grant select, insert on storage.objects to authenticated;
create policy annual_report_archives_storage_admin on storage.objects
for all to authenticated
using (bucket_id = 'annual-report-archives' and (select public.is_admin()))
with check (bucket_id = 'annual-report-archives' and (select public.is_admin()));
create policy annual_report_archives_storage_staff_select on storage.objects
for select to authenticated
using (bucket_id = 'annual-report-archives' and (select public.is_staff()));

create function public.archive_active_student_roster(
  p_academic_year text,
  p_history_xlsx_path text,
  p_history_pdf_path text,
  p_statistics_xlsx_path text,
  p_statistics_pdf_path text
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_archived_count integer;
begin
  if not public.is_admin() then
    raise exception using errcode = '42501', message = 'Admin role required';
  end if;

  if p_academic_year is null or p_academic_year !~ '^[0-9]{4}$'
    or p_history_xlsx_path is null or p_history_pdf_path is null
    or p_statistics_xlsx_path is null or p_statistics_pdf_path is null then
    raise exception using errcode = '22023', message = 'Valid year and all backup paths are required';
  end if;

  if (
    select pg_catalog.count(*)
    from storage.objects
    where bucket_id = 'annual-report-archives'
      and name = any(array[
        p_history_xlsx_path,
        p_history_pdf_path,
        p_statistics_xlsx_path,
        p_statistics_pdf_path
      ])
  ) <> 4 then
    raise exception using errcode = '22023', message = 'All four report backups must exist before archiving';
  end if;

  if not exists (
    select 1 from public.student_academic_records
    where is_active and academic_year = p_academic_year
  ) then
    raise exception using errcode = 'P0002', message = 'No active roster exists for this year';
  end if;
  if exists (
    select 1 from public.student_academic_records
    where is_active and academic_year <> p_academic_year
  ) then
    raise exception using errcode = '22023', message = 'Active roster contains a different academic year';
  end if;

  insert into public.annual_report_archives (
    academic_year,
    history_xlsx_path,
    history_pdf_path,
    statistics_xlsx_path,
    statistics_pdf_path,
    created_by
  ) values (
    p_academic_year,
    p_history_xlsx_path,
    p_history_pdf_path,
    p_statistics_xlsx_path,
    p_statistics_pdf_path,
    (select auth.uid())
  );

  update public.student_academic_records
  set is_active = false,
      updated_at = pg_catalog.now()
  where is_active;
  get diagnostics v_archived_count = row_count;

  insert into public.audit_logs (user_id, action, target, after_json)
  values (
    (select auth.uid()),
    'student_roster_archived',
    p_academic_year,
    pg_catalog.jsonb_build_object(
      'archived_student_count', v_archived_count,
      'history_xlsx_path', p_history_xlsx_path,
      'history_pdf_path', p_history_pdf_path,
      'statistics_xlsx_path', p_statistics_xlsx_path,
      'statistics_pdf_path', p_statistics_pdf_path
    )
  );

  return v_archived_count;
end;
$$;

revoke all on function public.archive_active_student_roster(text, text, text, text, text) from public, anon;
grant execute on function public.archive_active_student_roster(text, text, text, text, text) to authenticated;

commit;
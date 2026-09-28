begin;

create function public.import_student_roster(
  p_academic_year text,
  p_students jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_total integer;
  v_inserted integer;
  v_updated integer;
begin
  if not public.is_admin() then
    raise exception using errcode = '42501', message = 'Admin role required';
  end if;

  if p_academic_year is null or p_academic_year !~ '^[0-9]{4}$' then
    raise exception using errcode = '22023', message = 'Invalid academic year';
  end if;

  if p_students is null or pg_catalog.jsonb_typeof(p_students) <> 'array' then
    raise exception using errcode = '22023', message = 'Student rows must be a JSON array';
  end if;

  v_total := pg_catalog.jsonb_array_length(p_students);
  if v_total = 0 then
    raise exception using errcode = '22023', message = 'Student roster cannot be empty';
  end if;

  if exists (
    select 1
    from pg_catalog.jsonb_to_recordset(p_students) as imported(
      student_id text,
      number integer,
      sex text,
      name text,
      surname text,
      class_name text
    )
    where imported.student_id is null
      or imported.student_id !~ '^[0-9]{5}$'
      or imported.number is null
      or imported.number < 1
      or imported.sex not in ('ชาย', 'หญิง')
      or imported.name is null
      or pg_catalog.length(pg_catalog.btrim(imported.name)) = 0
      or imported.surname is null
      or pg_catalog.length(pg_catalog.btrim(imported.surname)) = 0
      or imported.class_name is null
      or pg_catalog.length(pg_catalog.btrim(imported.class_name)) = 0
  ) then
    raise exception using errcode = '22023', message = 'Roster contains invalid student rows';
  end if;

  if exists (
    select imported.student_id
    from pg_catalog.jsonb_to_recordset(p_students) as imported(
      student_id text,
      number integer,
      sex text,
      name text,
      surname text,
      class_name text
    )
    group by imported.student_id
    having pg_catalog.count(*) > 1
  ) then
    raise exception using errcode = '22023', message = 'Roster contains duplicate student IDs';
  end if;

  insert into public.students (student_id)
  select imported.student_id
  from pg_catalog.jsonb_to_recordset(p_students) as imported(
    student_id text,
    number integer,
    sex text,
    name text,
    surname text,
    class_name text
  )
  on conflict (student_id) do nothing;
  get diagnostics v_inserted = row_count;
  v_updated := v_total - v_inserted;

  update public.student_academic_records
  set is_active = false,
      updated_at = pg_catalog.now()
  where is_active;

  insert into public.student_academic_records (
    student_id,
    academic_year,
    number,
    sex,
    name,
    surname,
    class,
    is_active
  )
  select
    imported.student_id,
    p_academic_year,
    imported.number,
    imported.sex,
    pg_catalog.btrim(imported.name),
    pg_catalog.btrim(imported.surname),
    pg_catalog.btrim(imported.class_name),
    true
  from pg_catalog.jsonb_to_recordset(p_students) as imported(
    student_id text,
    number integer,
    sex text,
    name text,
    surname text,
    class_name text
  )
  on conflict (student_id, academic_year) do update
  set number = excluded.number,
      sex = excluded.sex,
      name = excluded.name,
      surname = excluded.surname,
      class = excluded.class,
      is_active = true,
      updated_at = pg_catalog.now();

  insert into public.audit_logs (user_id, action, target, after_json)
  values (
    (select auth.uid()),
    'student_roster_import',
    p_academic_year,
    pg_catalog.jsonb_build_object(
      'academic_year', p_academic_year,
      'student_count', v_total,
      'new_student_count', v_inserted,
      'existing_student_count', v_updated
    )
  );

  return pg_catalog.jsonb_build_object(
    'academic_year', p_academic_year,
    'student_count', v_total,
    'new_student_count', v_inserted,
    'existing_student_count', v_updated
  );
end;
$$;

revoke all on function public.import_student_roster(text, jsonb) from public, anon;
grant execute on function public.import_student_roster(text, jsonb) to authenticated;

commit;

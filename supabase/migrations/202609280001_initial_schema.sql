begin;

create table public.students (
  student_id text primary key check (student_id ~ '^[0-9]{5}$'),
  current_status text not null default 'ปกติ'
    check (current_status in ('ปกติ', 'ติดตาม', 'ลาพัก')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.student_academic_records (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.students(student_id) on delete restrict,
  academic_year text not null check (academic_year ~ '^[0-9]{4}$'),
  number integer check (number is null or number > 0),
  sex text not null check (sex in ('ชาย', 'หญิง')),
  name text not null check (length(btrim(name)) > 0),
  surname text not null check (length(btrim(surname)) > 0),
  class text not null check (length(btrim(class)) > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_academic_records_student_year_key unique (student_id, academic_year),
  constraint student_academic_records_id_student_key unique (id, student_id)
);

create unique index student_academic_records_one_active_per_student
  on public.student_academic_records(student_id)
  where is_active;

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null check (length(btrim(display_name)) > 0),
  role text not null default 'staff' check (role in ('admin', 'staff')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.service_item_types (
  id integer generated always as identity primary key,
  group_name text not null check (group_name in ('symptom', 'note')),
  code text not null unique check (code ~ '^[a-z][a-z0-9_]*$'),
  name text not null check (length(btrim(name)) > 0),
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.service_records (
  id bigint generated always as identity primary key,
  service_datetime timestamptz not null default now(),
  student_id text not null references public.students(student_id) on delete restrict,
  academic_record_id uuid not null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint service_records_academic_student_fk
    foreign key (academic_record_id, student_id)
    references public.student_academic_records(id, student_id) on delete restrict
);

create table public.service_record_items (
  id bigint generated always as identity primary key,
  record_id bigint not null references public.service_records(id) on delete cascade,
  item_id integer not null references public.service_item_types(id) on delete restrict,
  other_detail text,
  created_at timestamptz not null default now(),
  constraint service_record_items_record_item_key unique (record_id, item_id),
  constraint service_record_items_other_detail_length
    check (other_detail is null or length(btrim(other_detail)) between 1 and 500)
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  target text not null,
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz not null default now()
);

create index student_academic_records_class_year_idx
  on public.student_academic_records(academic_year, class);
create index service_records_datetime_idx
  on public.service_records(service_datetime desc);
create index service_records_student_datetime_idx
  on public.service_records(student_id, service_datetime desc);
create index service_record_items_item_record_idx
  on public.service_record_items(item_id, record_id);
create index audit_logs_created_at_idx
  on public.audit_logs(created_at desc);

insert into public.service_item_types (group_name, code, name, display_order)
values
  ('symptom', 'headache_fever', 'ปวดหัว/เป็นไข้', 1),
  ('symptom', 'menstrual_pain', 'ปวดรอบเดือน', 2),
  ('symptom', 'stomach_pain', 'ปวดท้อง/แสบร้อน', 3),
  ('symptom', 'bloating', 'ปวดท้องอืดเฟ้อ', 4),
  ('symptom', 'diarrhea', 'ท้องเสีย', 5),
  ('symptom', 'nausea_vomit', 'คลื่นไส้/อาเจียน', 6),
  ('symptom', 'runny_nose', 'น้ำมูก/แพ้อากาศ', 7),
  ('symptom', 'cough_phlegm', 'แก้ไอเสมหะ', 8),
  ('symptom', 'allergic_rash', 'แพ้ผื่นคัน/แมลงต่อย', 9),
  ('symptom', 'massage_cool', 'ปวดนวด/ประคบ', 10),
  ('symptom', 'eye_rinse', 'ล้างตา/ตาแดง', 11),
  ('symptom', 'insect_bite', 'แมลงกัดต่อย', 12),
  ('symptom', 'wound_care', 'ทำแผล', 13),
  ('note', 'rest', 'นอนพัก', 14),
  ('note', 'go_home', 'กลับบ้าน', 15),
  ('note', 'accident', 'อุบัติเหตุ', 16),
  ('note', 'send_hospital', 'ส่ง รพ.', 17),
  ('note', 'other', 'อื่นๆ', 18)
on conflict (code) do update
set group_name = excluded.group_name,
    name = excluded.name,
    display_order = excluded.display_order,
    active = true;

create function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users u
    where u.id = (select auth.uid())
      and u.active
      and u.role in ('admin', 'staff')
  );
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users u
    where u.id = (select auth.uid())
      and u.active
      and u.role = 'admin'
  );
$$;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

create trigger students_set_updated_at
before update on public.students
for each row execute function public.set_updated_at();

create trigger student_academic_records_set_updated_at
before update on public.student_academic_records
for each row execute function public.set_updated_at();

create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create function public.create_service_record(
  p_student_id text,
  p_item_codes text[],
  p_other_detail text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_academic_record_id uuid;
  v_record_id bigint;
  v_service_datetime timestamptz;
  v_other_item_id integer;
begin
  if p_student_id is null or p_student_id !~ '^[0-9]{5}$' then
    raise exception using errcode = '22023', message = 'Invalid student_id';
  end if;

  if p_item_codes is null or cardinality(p_item_codes) = 0 then
    raise exception using errcode = '22023', message = 'At least one item is required';
  end if;

  if exists (
    select 1
    from pg_catalog.unnest(p_item_codes) as submitted(code)
    group by submitted.code
    having count(*) > 1
  ) then
    raise exception using errcode = '22023', message = 'Duplicate item codes are not allowed';
  end if;

  if exists (
    select 1
    from pg_catalog.unnest(p_item_codes) as submitted(code)
    left join public.service_item_types item
      on item.code = submitted.code and item.active
    where item.id is null
  ) then
    raise exception using errcode = '22023', message = 'Unknown or inactive item code';
  end if;

  select id into v_other_item_id
  from public.service_item_types
  where code = 'other' and group_name = 'note' and active;

  if 'other' = any(p_item_codes) then
    if p_other_detail is null or length(btrim(p_other_detail)) = 0 then
      raise exception using errcode = '22023', message = 'other_detail is required for the other item';
    end if;
    if length(btrim(p_other_detail)) > 500 then
      raise exception using errcode = '22023', message = 'other_detail exceeds 500 characters';
    end if;
  elsif p_other_detail is not null and length(btrim(p_other_detail)) > 0 then
    raise exception using errcode = '22023', message = 'other_detail requires the other item';
  end if;

  select academic.id into v_academic_record_id
  from public.students student
  join public.student_academic_records academic
    on academic.student_id = student.student_id and academic.is_active
  where student.student_id = p_student_id
    and student.current_status <> 'ลาพัก'
  limit 1;

  if v_academic_record_id is null then
    raise exception using errcode = 'P0002', message = 'Active student not found';
  end if;

  insert into public.service_records (student_id, academic_record_id)
  values (p_student_id, v_academic_record_id)
  returning id, service_datetime into v_record_id, v_service_datetime;

  insert into public.service_record_items (record_id, item_id, other_detail)
  select
    v_record_id,
    item.id,
    case when item.id = v_other_item_id then nullif(btrim(p_other_detail), '') else null end
  from public.service_item_types item
  where item.code = any(p_item_codes)
    and item.active;

  return pg_catalog.jsonb_build_object(
    'record_id', v_record_id,
    'service_datetime', v_service_datetime,
    'student_id', p_student_id,
    'selected_items', pg_catalog.to_jsonb(p_item_codes)
  );
end;
$$;

alter table public.students enable row level security;
alter table public.student_academic_records enable row level security;
alter table public.users enable row level security;
alter table public.service_item_types enable row level security;
alter table public.service_records enable row level security;
alter table public.service_record_items enable row level security;
alter table public.audit_logs enable row level security;

create policy students_staff_select on public.students
for select to authenticated using ((select public.is_staff()));
create policy students_admin_write on public.students
for all to authenticated using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy academic_records_staff_select on public.student_academic_records
for select to authenticated using ((select public.is_staff()));
create policy academic_records_admin_write on public.student_academic_records
for all to authenticated using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy users_self_or_admin_select on public.users
for select to authenticated using (id = (select auth.uid()) or (select public.is_admin()));
create policy users_admin_write on public.users
for all to authenticated using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy service_item_types_staff_select on public.service_item_types
for select to authenticated using ((select public.is_staff()));
create policy service_item_types_admin_write on public.service_item_types
for all to authenticated using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy service_records_staff_access on public.service_records
for all to authenticated using ((select public.is_staff()))
with check ((select public.is_staff()));
create policy service_record_items_staff_access on public.service_record_items
for all to authenticated using ((select public.is_staff()))
with check ((select public.is_staff()));

create policy audit_logs_admin_select on public.audit_logs
for select to authenticated using ((select public.is_admin()));
create policy audit_logs_admin_insert on public.audit_logs
for insert to authenticated with check ((select public.is_admin()));

revoke all on public.students, public.student_academic_records, public.users,
  public.service_item_types, public.service_records, public.service_record_items,
  public.audit_logs from anon;
revoke all on function public.create_service_record(text, text[], text) from public, anon, authenticated;
revoke all on function public.is_staff() from public, anon;
revoke all on function public.is_admin() from public, anon;
revoke all on function public.set_updated_at() from public, anon, authenticated;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.create_service_record(text, text[], text) to service_role;

grant select, insert, update, delete on public.students,
  public.student_academic_records, public.users, public.service_item_types,
  public.service_records, public.service_record_items to authenticated, service_role;
grant select, insert on public.audit_logs to authenticated;
grant all privileges on public.audit_logs to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

commit;

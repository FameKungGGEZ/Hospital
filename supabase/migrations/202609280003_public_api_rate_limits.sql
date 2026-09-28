begin;

create table public.public_api_rate_limits (
  key_hash text not null check (key_hash ~ '^[a-f0-9]{64}$'),
  window_started_at timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  primary key (key_hash, window_started_at)
);

alter table public.public_api_rate_limits enable row level security;
revoke all on public.public_api_rate_limits from public, anon, authenticated;

grant select, insert, update, delete on public.public_api_rate_limits to service_role;

create function public.consume_public_api_rate_limit(
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window_start timestamptz;
  v_request_count integer;
begin
  if p_key_hash is null or p_key_hash !~ '^[a-f0-9]{64}$'
    or p_limit < 1 or p_limit > 1000
    or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception using errcode = '22023', message = 'Invalid rate limit parameters';
  end if;

  v_window_start := pg_catalog.to_timestamp(
    pg_catalog.floor(extract(epoch from pg_catalog.now()) / p_window_seconds) * p_window_seconds
  );

  delete from public.public_api_rate_limits
  where window_started_at < pg_catalog.now() - interval '2 days';

  insert into public.public_api_rate_limits (key_hash, window_started_at, request_count)
  values (p_key_hash, v_window_start, 1)
  on conflict (key_hash, window_started_at) do update
  set request_count = public.public_api_rate_limits.request_count + 1
  returning request_count into v_request_count;

  return v_request_count <= p_limit;
end;
$$;

revoke all on function public.consume_public_api_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_public_api_rate_limit(text, integer, integer) to service_role;

commit;

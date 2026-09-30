begin;

insert into public.service_item_types (group_name, code, name, display_order)
values ('note', 'return_class', 'กลับห้องเรียน', 19)
on conflict (code) do update
set group_name = excluded.group_name,
    name = excluded.name,
    display_order = excluded.display_order,
    active = true;

commit;
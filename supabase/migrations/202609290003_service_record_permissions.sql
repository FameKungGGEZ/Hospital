begin;

revoke insert, update, delete on public.service_records, public.service_record_items from authenticated;

drop policy service_records_staff_access on public.service_records;
create policy service_records_staff_select on public.service_records
for select to authenticated using ((select public.is_staff()));

drop policy service_record_items_staff_access on public.service_record_items;
create policy service_record_items_staff_select on public.service_record_items
for select to authenticated using ((select public.is_staff()));

commit;
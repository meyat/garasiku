-- =========================================================
-- GarasiKu — Row Level Security
-- =========================================================

-- Helper: check current user is admin
create or replace function is_admin()
returns boolean language sql stable as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------- PROFILES ----------
alter table profiles enable row level security;

create policy "profiles_select_own" on profiles
  for select using (id = auth.uid());

create policy "profiles_update_own" on profiles
  for update using (id = auth.uid());

create policy "profiles_insert_own" on profiles
  for insert with check (id = auth.uid());

-- ---------- MASTER DATA: public read, admin write ----------
alter table vehicle_brands enable row level security;
alter table vehicle_models enable row level security;
alter table vehicle_variants enable row level security;
alter table vehicle_variant_years enable row level security;
alter table component_categories enable row level security;
alter table components enable row level security;
alter table vehicle_component_compatibility enable row level security;
alter table service_intervals enable row level security;

create policy "master_read_authenticated" on vehicle_brands for select using (auth.role() = 'authenticated');
create policy "master_write_admin" on vehicle_brands for all using (is_admin()) with check (is_admin());

create policy "master_read_authenticated" on vehicle_models for select using (auth.role() = 'authenticated');
create policy "master_write_admin" on vehicle_models for all using (is_admin()) with check (is_admin());

create policy "master_read_authenticated" on vehicle_variants for select using (auth.role() = 'authenticated');
create policy "master_write_admin" on vehicle_variants for all using (is_admin()) with check (is_admin());

create policy "master_read_authenticated" on vehicle_variant_years for select using (auth.role() = 'authenticated');
create policy "master_write_admin" on vehicle_variant_years for all using (is_admin()) with check (is_admin());

create policy "master_read_authenticated" on component_categories for select using (auth.role() = 'authenticated');
create policy "master_write_admin" on component_categories for all using (is_admin()) with check (is_admin());

create policy "master_read_authenticated" on components for select using (auth.role() = 'authenticated');
create policy "master_write_admin" on components for all using (is_admin()) with check (is_admin());

create policy "master_read_authenticated" on vehicle_component_compatibility for select using (auth.role() = 'authenticated');
create policy "master_write_admin" on vehicle_component_compatibility for all using (is_admin()) with check (is_admin());

create policy "master_read_authenticated" on service_intervals for select using (auth.role() = 'authenticated');
create policy "master_write_admin" on service_intervals for all using (is_admin()) with check (is_admin());

-- ---------- USER-OWNED TABLES ----------
alter table vehicles enable row level security;
create policy "vehicles_owner_all" on vehicles
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

alter table odometer_logs enable row level security;
create policy "odometer_owner_all" on odometer_logs
  for all using (
    exists (select 1 from vehicles v where v.id = odometer_logs.vehicle_id and v.owner_id = auth.uid())
  ) with check (
    exists (select 1 from vehicles v where v.id = odometer_logs.vehicle_id and v.owner_id = auth.uid())
  );

alter table service_records enable row level security;
create policy "service_records_owner_all" on service_records
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

alter table service_items enable row level security;
create policy "service_items_owner_all" on service_items
  for all using (
    exists (select 1 from service_records sr where sr.id = service_items.service_record_id and sr.owner_id = auth.uid())
  ) with check (
    exists (select 1 from service_records sr where sr.id = service_items.service_record_id and sr.owner_id = auth.uid())
  );

alter table fuel_logs enable row level security;
create policy "fuel_logs_owner_all" on fuel_logs
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

alter table expenses enable row level security;
create policy "expenses_owner_all" on expenses
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

alter table reminders enable row level security;
create policy "reminders_owner_all" on reminders
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------- Auto-create profile row on signup ----------
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

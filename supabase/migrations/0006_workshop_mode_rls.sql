-- =========================================================
-- GarasiKu — Workshop Mode RLS
-- =========================================================

-- ---------- WORKSHOPS ----------
alter table workshops enable row level security;

create policy "workshops_member_select" on workshops
  for select using (is_workshop_member(id));

create policy "workshops_owner_insert" on workshops
  for insert with check (owner_id = auth.uid());

create policy "workshops_owner_update" on workshops
  for update using (owner_id = auth.uid());

create policy "workshops_owner_delete" on workshops
  for delete using (owner_id = auth.uid());

-- ---------- WORKSHOP MEMBERS ----------
alter table workshop_members enable row level security;

-- IMPORTANT: this policy must NOT call is_workshop_member() (which itself queries
-- workshop_members) — that would cause infinite RLS recursion. Instead: a user can see
-- their own membership row directly, and the workshop owner can see every row via the
-- workshops table (not workshop_members), which is a different, non-recursive check.
create policy "workshop_members_select" on workshop_members
  for select using (
    user_id = auth.uid()
    or exists (select 1 from workshops w where w.id = workshop_members.workshop_id and w.owner_id = auth.uid())
  );

-- Only the workshop owner can add/remove staff (checked via workshops.owner_id, not
-- workshop_members itself, to avoid the same recursion issue).
create policy "workshop_members_owner_write" on workshop_members
  for all using (
    exists (select 1 from workshops w where w.id = workshop_members.workshop_id and w.owner_id = auth.uid())
  ) with check (
    exists (select 1 from workshops w where w.id = workshop_members.workshop_id and w.owner_id = auth.uid())
  );

-- ---------- VEHICLE ACCESS GRANTS ----------
alter table vehicle_workshop_access enable row level security;

-- The vehicle owner can grant/revoke access to their own vehicle.
create policy "vehicle_access_owner_manage" on vehicle_workshop_access
  for all using (
    exists (select 1 from vehicles v where v.id = vehicle_workshop_access.vehicle_id and v.owner_id = auth.uid())
  ) with check (
    granted_by = auth.uid() and
    exists (select 1 from vehicles v where v.id = vehicle_workshop_access.vehicle_id and v.owner_id = auth.uid())
  );

-- Workshop members can see grants made to their workshop (so they know which vehicles they can touch).
create policy "vehicle_access_workshop_select" on vehicle_workshop_access
  for select using (is_workshop_member(workshop_id));

-- ---------- Extend vehicles/service_records visibility to authorized workshop staff ----------
-- Vehicle owners keep full control (existing policy from 0002). This adds READ-ONLY access
-- for workshop members with an active grant — they still can't see vehicles without one.
create policy "vehicles_workshop_read" on vehicles
  for select using (has_vehicle_access(id));

create policy "service_records_workshop_insert" on service_records
  for insert with check (has_vehicle_access(vehicle_id));

create policy "service_records_workshop_select" on service_records
  for select using (has_vehicle_access(vehicle_id));

create policy "service_items_workshop_all" on service_items
  for all using (
    exists (
      select 1 from service_records sr
      where sr.id = service_items.service_record_id and has_vehicle_access(sr.vehicle_id)
    )
  ) with check (
    exists (
      select 1 from service_records sr
      where sr.id = service_items.service_record_id and has_vehicle_access(sr.vehicle_id)
    )
  );

-- ---------- INVENTORY ----------
alter table inventory_items enable row level security;
create policy "inventory_items_member_all" on inventory_items
  for all using (is_workshop_member(workshop_id)) with check (is_workshop_member(workshop_id));

alter table inventory_movements enable row level security;
create policy "inventory_movements_member_all" on inventory_movements
  for all using (is_workshop_member(workshop_id)) with check (is_workshop_member(workshop_id));

-- ---------- INVOICES ----------
alter table invoices enable row level security;
create policy "invoices_member_all" on invoices
  for all using (is_workshop_member(workshop_id)) with check (is_workshop_member(workshop_id));

alter table invoice_items enable row level security;
create policy "invoice_items_member_all" on invoice_items
  for all using (
    exists (select 1 from invoices i where i.id = invoice_items.invoice_id and is_workshop_member(i.workshop_id))
  ) with check (
    exists (select 1 from invoices i where i.id = invoice_items.invoice_id and is_workshop_member(i.workshop_id))
  );

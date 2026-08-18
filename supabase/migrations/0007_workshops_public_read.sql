-- =========================================================
-- GarasiKu — Public workshop directory read
-- Vehicle owners need to be able to FIND a workshop (by name) to grant it access to their
-- vehicle, even before they're a member of it. Workshops act like a public business
-- directory entry — name/address/phone are not sensitive, unlike everything else
-- (members, inventory, invoices) which stays restricted to workshop_members via existing policies.
-- =========================================================

create policy "workshops_public_read" on workshops
  for select using (auth.role() = 'authenticated');

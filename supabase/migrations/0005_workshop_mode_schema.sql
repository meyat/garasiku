-- =========================================================
-- GarasiKu — Phase 4: Workshop Mode
-- Multi-tenant: a workshop has staff (mechanics), manages inventory, and can service
-- vehicles that don't belong to its own staff — only when the vehicle owner grants access.
-- =========================================================

-- ---------- WORKSHOPS ----------
create table workshops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  address text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table workshop_members (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references workshops(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'mechanic' check (role in ('owner', 'mechanic', 'staff')),
  created_at timestamptz not null default now(),
  unique (workshop_id, user_id)
);

-- ---------- VEHICLE ACCESS GRANTS ----------
-- A vehicle owner explicitly grants a workshop the ability to view/service their vehicle.
-- This is the ONLY bridge between a customer's private vehicle data and a workshop —
-- without a grant row, workshop staff have zero access (enforced by RLS below).
create table vehicle_workshop_access (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  workshop_id uuid not null references workshops(id) on delete cascade,
  granted_by uuid not null references profiles(id), -- must be the vehicle owner
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (vehicle_id, workshop_id)
);

-- ---------- INVENTORY ----------
create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references workshops(id) on delete cascade,
  component_id uuid references components(id), -- optional link to master component catalog
  name text not null,
  sku text,
  unit text not null default 'pcs',
  quantity_on_hand numeric(12,2) not null default 0,
  unit_cost numeric(14,2) not null default 0,
  unit_price numeric(14,2) not null default 0,
  reorder_threshold numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workshop_id, sku)
);

create table inventory_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references inventory_items(id) on delete cascade,
  workshop_id uuid not null references workshops(id) on delete cascade,
  change_qty numeric(12,2) not null, -- positive = stock in, negative = stock out
  reason text not null check (reason in ('purchase', 'sale', 'adjustment', 'service_use')),
  related_service_id uuid references service_records(id) on delete set null,
  note text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

-- ---------- INVOICES ----------
create table invoices (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references workshops(id) on delete cascade,
  vehicle_id uuid references vehicles(id) on delete set null,
  service_record_id uuid references service_records(id) on delete set null,
  invoice_number text not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'void')),
  customer_name text,
  customer_phone text,
  subtotal numeric(14,2) not null default 0,
  tax numeric(14,2) not null default 0,
  total numeric(14,2) generated always as (subtotal + tax) stored,
  issued_date date not null default current_date,
  due_date date,
  notes text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workshop_id, invoice_number)
);

create table invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(14,2) not null default 0,
  amount numeric(14,2) generated always as (quantity * unit_price) stored,
  inventory_item_id uuid references inventory_items(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- Helper: current user's workshop membership ----------
create or replace function is_workshop_member(target_workshop_id uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from workshop_members
    where workshop_id = target_workshop_id and user_id = auth.uid()
  );
$$;

create or replace function has_vehicle_access(target_vehicle_id uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from vehicle_workshop_access vwa
    join workshop_members wm on wm.workshop_id = vwa.workshop_id
    where vwa.vehicle_id = target_vehicle_id
      and wm.user_id = auth.uid()
      and vwa.revoked_at is null
  );
$$;

-- ---------- updated_at triggers ----------
create trigger trg_workshops_updated_at before update on workshops
  for each row execute function set_updated_at();
create trigger trg_inventory_items_updated_at before update on inventory_items
  for each row execute function set_updated_at();
create trigger trg_invoices_updated_at before update on invoices
  for each row execute function set_updated_at();

-- ---------- inventory stock auto-update from movements ----------
create or replace function apply_inventory_movement()
returns trigger language plpgsql as $$
begin
  update inventory_items
  set quantity_on_hand = quantity_on_hand + new.change_qty
  where id = new.item_id;
  return new;
end;
$$;

create trigger trg_apply_inventory_movement after insert on inventory_movements
  for each row execute function apply_inventory_movement();

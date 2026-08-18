-- =========================================================
-- GarasiKu — Phase 1 Schema
-- =========================================================
create extension if not exists "pgcrypto";

-- ---------- PROFILES ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- MASTER VEHICLE DATA ----------
create table vehicle_brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  logo_url text,
  created_at timestamptz not null default now()
);

create table vehicle_models (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references vehicle_brands(id) on delete cascade,
  name text not null,
  vehicle_type text not null default 'motorcycle' check (vehicle_type in ('motorcycle','car')),
  created_at timestamptz not null default now(),
  unique (brand_id, name)
);

create table vehicle_variants (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references vehicle_models(id) on delete cascade,
  name text not null, -- e.g. "ABS", "CBS", "Standard"
  engine_cc integer,
  transmission text check (transmission in ('manual','automatic','semi-automatic')),
  fuel_type text check (fuel_type in ('gasoline','diesel','electric','hybrid')),
  created_at timestamptz not null default now(),
  unique (model_id, name)
);

create table vehicle_variant_years (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references vehicle_variants(id) on delete cascade,
  year integer not null,
  created_at timestamptz not null default now(),
  unique (variant_id, year)
);

-- ---------- COMPONENT MASTER DATA ----------
create table component_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, -- Engine, Transmission/CVT, Brakes, Wheels & Suspension, Electrical, Body
  sort_order integer not null default 0
);

create table components (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references component_categories(id) on delete restrict,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  unique (category_id, name)
);

-- ---------- COMPATIBILITY (source of truth, AI must not override) ----------
create table vehicle_component_compatibility (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references vehicle_variants(id) on delete cascade,
  component_id uuid not null references components(id) on delete cascade,
  is_required boolean not null default true,
  created_at timestamptz not null default now(),
  unique (variant_id, component_id)
);

-- ---------- SERVICE INTERVALS ----------
create table service_intervals (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references vehicle_variants(id) on delete cascade,
  component_id uuid not null references components(id) on delete cascade,
  interval_km integer,          -- e.g. replace every 4000 km
  interval_months integer,      -- e.g. replace every 6 months
  inspect_only boolean not null default false, -- e.g. brake pad: inspection required, no fixed interval
  notes text,
  created_at timestamptz not null default now(),
  unique (variant_id, component_id),
  constraint interval_has_value check (
    inspect_only = true or interval_km is not null or interval_months is not null
  )
);

-- ---------- VEHICLES (user-owned) ----------
create table vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  variant_id uuid references vehicle_variants(id),
  nickname text not null,
  brand_name text not null,   -- denormalized fallback for AI-detected / unmatched vehicles
  model_name text not null,
  variant_name text,
  production_year integer,
  license_plate text,
  current_odometer integer not null default 0 check (current_odometer >= 0),
  engine_cc integer,
  transmission text,
  fuel_type text,
  purchase_date date,
  purchase_price numeric(14,2),
  photo_url text,
  notes text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_vehicles_owner on vehicles(owner_id) where is_archived = false;

-- ---------- ODOMETER HISTORY ----------
create table odometer_logs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  odometer integer not null check (odometer >= 0),
  source text not null check (source in ('manual','fuel_log','service_record','correction')),
  is_correction boolean not null default false,
  note text,
  recorded_at timestamptz not null default now(),
  created_by uuid not null references profiles(id)
);
create index idx_odometer_vehicle on odometer_logs(vehicle_id, recorded_at desc);

-- ---------- SERVICE RECORDS ----------
create table service_records (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  owner_id uuid not null references profiles(id) on delete cascade,
  service_date date not null default current_date,
  odometer integer not null check (odometer >= 0),
  workshop_name text,
  mechanic_name text,
  notes text,
  labor_cost numeric(14,2) not null default 0,
  parts_cost numeric(14,2) not null default 0,
  total_cost numeric(14,2) generated always as (labor_cost + parts_cost) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_service_records_vehicle on service_records(vehicle_id, service_date desc);

create table service_items (
  id uuid primary key default gen_random_uuid(),
  service_record_id uuid not null references service_records(id) on delete cascade,
  component_id uuid references components(id),
  action text not null check (action in ('inspect','clean','repair','replace','adjust','other')),
  condition_note text, -- e.g. "Good", "Worn", "Damaged"
  cost numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);
create index idx_service_items_record on service_items(service_record_id);

-- ---------- FUEL LOGS ----------
create table fuel_logs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  owner_id uuid not null references profiles(id) on delete cascade,
  filled_at timestamptz not null default now(),
  odometer integer not null check (odometer >= 0),
  fuel_type text,
  liters numeric(8,3) not null check (liters > 0),
  price_per_liter numeric(10,2),
  total_cost numeric(14,2),
  gas_station text,
  is_full_tank boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  constraint price_or_total_present check (price_per_liter is not null or total_cost is not null)
);
create index idx_fuel_logs_vehicle on fuel_logs(vehicle_id, filled_at desc);

-- ---------- EXPENSES ----------
create table expenses (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  owner_id uuid not null references profiles(id) on delete cascade,
  category text not null check (category in
    ('fuel','service','spare_parts','tires','tax','insurance','parking','accessories','wash','other')),
  amount numeric(14,2) not null check (amount >= 0),
  expense_date date not null default current_date,
  description text,
  related_service_id uuid references service_records(id) on delete set null,
  related_fuel_log_id uuid references fuel_logs(id) on delete set null,
  created_at timestamptz not null default now()
);
create index idx_expenses_vehicle on expenses(vehicle_id, expense_date desc);

-- ---------- REMINDERS (Phase 2, table created now for stability) ----------
create table reminders (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  owner_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('service','tax','insurance','inspection','other')),
  title text not null,
  due_date date,
  due_odometer integer,
  is_dismissed boolean not null default false,
  snoozed_until date,
  created_at timestamptz not null default now()
);

-- ---------- updated_at trigger helper ----------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_vehicles_updated_at before update on vehicles
  for each row execute function set_updated_at();
create trigger trg_service_records_updated_at before update on service_records
  for each row execute function set_updated_at();
create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

-- ---------- odometer sync trigger ----------
-- Whenever a new odometer_logs row is inserted with a higher value (or explicit correction),
-- update vehicles.current_odometer. This keeps a single source of truth.
create or replace function apply_odometer_log()
returns trigger language plpgsql as $$
declare
  v_current integer;
begin
  select current_odometer into v_current from vehicles where id = new.vehicle_id for update;

  if new.is_correction or new.odometer >= v_current then
    update vehicles set current_odometer = new.odometer where id = new.vehicle_id;
  end if;

  return new;
end;
$$;

create trigger trg_apply_odometer_log after insert on odometer_logs
  for each row execute function apply_odometer_log();

-- Convenience: auto-create an odometer_logs row whenever a fuel_log or service_record is inserted
create or replace function log_odometer_from_fuel()
returns trigger language plpgsql as $$
begin
  insert into odometer_logs (vehicle_id, odometer, source, created_by)
  values (new.vehicle_id, new.odometer, 'fuel_log', new.owner_id);
  return new;
end;
$$;
create trigger trg_fuel_log_odometer after insert on fuel_logs
  for each row execute function log_odometer_from_fuel();

create or replace function log_odometer_from_service()
returns trigger language plpgsql as $$
begin
  insert into odometer_logs (vehicle_id, odometer, source, created_by)
  values (new.vehicle_id, new.odometer, 'service_record', new.owner_id);
  return new;
end;
$$;
create trigger trg_service_record_odometer after insert on service_records
  for each row execute function log_odometer_from_service();

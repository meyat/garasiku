-- =========================================================
-- GarasiKu — Example seed data (Honda Vario 160 ABS 2024)
-- Safe to run once; uses ON CONFLICT to stay idempotent.
-- =========================================================

insert into vehicle_brands (name) values ('Honda') on conflict (name) do nothing;

insert into vehicle_models (brand_id, name, vehicle_type)
select id, 'Vario 160', 'motorcycle' from vehicle_brands where name = 'Honda'
on conflict (brand_id, name) do nothing;

insert into vehicle_variants (model_id, name, engine_cc, transmission, fuel_type)
select m.id, 'ABS', 160, 'automatic', 'gasoline'
from vehicle_models m join vehicle_brands b on b.id = m.brand_id
where b.name = 'Honda' and m.name = 'Vario 160'
on conflict (model_id, name) do nothing;

insert into vehicle_variant_years (variant_id, year)
select v.id, 2024
from vehicle_variants v
join vehicle_models m on m.id = v.model_id
join vehicle_brands b on b.id = m.brand_id
where b.name = 'Honda' and m.name = 'Vario 160' and v.name = 'ABS'
on conflict (variant_id, year) do nothing;

insert into component_categories (name, sort_order) values
  ('Engine', 1), ('Transmission/CVT', 2), ('Brakes', 3),
  ('Wheels & Suspension', 4), ('Electrical', 5), ('Body', 6)
on conflict (name) do nothing;

insert into components (category_id, name) values
  ((select id from component_categories where name = 'Engine'), 'Engine Oil'),
  ((select id from component_categories where name = 'Engine'), 'Oil Filter'),
  ((select id from component_categories where name = 'Engine'), 'Spark Plug'),
  ((select id from component_categories where name = 'Engine'), 'Air Filter'),
  ((select id from component_categories where name = 'Engine'), 'Coolant'),
  ((select id from component_categories where name = 'Transmission/CVT'), 'V-Belt'),
  ((select id from component_categories where name = 'Transmission/CVT'), 'Roller'),
  ((select id from component_categories where name = 'Transmission/CVT'), 'Gear Oil'),
  ((select id from component_categories where name = 'Brakes'), 'Front Brake Pad'),
  ((select id from component_categories where name = 'Brakes'), 'Rear Brake Pad'),
  ((select id from component_categories where name = 'Brakes'), 'Brake Fluid'),
  ((select id from component_categories where name = 'Electrical'), 'Battery')
on conflict (category_id, name) do nothing;

-- Compatibility for Honda Vario 160 ABS
insert into vehicle_component_compatibility (variant_id, component_id)
select v.id, c.id
from vehicle_variants v
join vehicle_models m on m.id = v.model_id
join vehicle_brands b on b.id = m.brand_id
cross join components c
where b.name = 'Honda' and m.name = 'Vario 160' and v.name = 'ABS'
  and c.name in ('Engine Oil','Oil Filter','Spark Plug','Air Filter','Coolant',
                 'V-Belt','Roller','Gear Oil','Front Brake Pad','Rear Brake Pad',
                 'Brake Fluid','Battery')
on conflict (variant_id, component_id) do nothing;

-- Service intervals for Honda Vario 160 ABS
insert into service_intervals (variant_id, component_id, interval_km, interval_months, inspect_only, notes)
select v.id, c.id, vals.interval_km, vals.interval_months, vals.inspect_only, vals.notes
from vehicle_variants v
join vehicle_models m on m.id = v.model_id
join vehicle_brands b on b.id = m.brand_id
join (values
  ('Engine Oil', 4000, 6, false, 'Replace every 4,000 km or 6 months'),
  ('Oil Filter', 8000, 12, false, 'Replace every 2nd oil change'),
  ('Spark Plug', 8000, 12, false, null),
  ('Air Filter', 8000, null, false, 'Clean at 4,000 km, replace at 8,000 km'),
  ('Coolant', null, 12, false, 'Replace yearly'),
  ('V-Belt', 24000, null, false, 'Inspect from 20,000 km'),
  ('Roller', 24000, null, false, null),
  ('Gear Oil', 8000, null, false, null),
  ('Front Brake Pad', null, null, true, 'Inspection required; wear depends on usage'),
  ('Rear Brake Pad', null, null, true, 'Inspection required; wear depends on usage'),
  ('Brake Fluid', null, 24, false, 'Replace every 2 years'),
  ('Battery', null, 24, false, 'Inspect/replace as needed, ~2 years typical life')
) as vals(component_name, interval_km, interval_months, inspect_only, notes)
  on true
join components c on c.name = vals.component_name
where b.name = 'Honda' and m.name = 'Vario 160' and v.name = 'ABS'
on conflict (variant_id, component_id) do nothing;

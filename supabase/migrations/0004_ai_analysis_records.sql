-- =========================================================
-- GarasiKu — AI analysis records
-- Stores AI suggestion history (damage inspection, maintenance suggestions, vehicle detection).
-- These are logs of AI *suggestions* only — never a source of truth for compatibility/intervals.
-- =========================================================

create table ai_analysis_records (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references vehicles(id) on delete cascade,
  owner_id uuid not null references profiles(id) on delete cascade,
  analysis_type text not null check (analysis_type in
    ('vehicle_detection', 'damage_inspection', 'maintenance_suggestion')),
  result jsonb not null,
  created_at timestamptz not null default now()
);
create index idx_ai_analysis_vehicle on ai_analysis_records(vehicle_id, created_at desc);

alter table ai_analysis_records enable row level security;
create policy "ai_analysis_owner_all" on ai_analysis_records
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- =========================================================
-- GarasiKu — Add 'component_suggestion' as a distinct AI analysis type
-- (previously would have been lumped under 'maintenance_suggestion')
-- =========================================================

alter table ai_analysis_records drop constraint ai_analysis_records_analysis_type_check;

alter table ai_analysis_records add constraint ai_analysis_records_analysis_type_check
  check (analysis_type in ('vehicle_detection', 'damage_inspection', 'maintenance_suggestion', 'component_suggestion'));

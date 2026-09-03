export const MIGRATION_001 = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  archived_at TEXT
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES categories(id),
  archived_at TEXT
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  notes TEXT,
  original_text TEXT NOT NULL,
  channel TEXT NOT NULL,
  project_id TEXT REFERENCES projects(id),
  category_id TEXT REFERENCES categories(id),
  status TEXT NOT NULL,
  snooze_origin TEXT,
  previous_status TEXT,
  urgent INTEGER NOT NULL DEFAULT 0,
  important INTEGER NOT NULL DEFAULT 0,
  work_type TEXT,
  nominal_minutes INTEGER,
  deadline TEXT,
  available_on TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  processed_at TEXT,
  completed_at TEXT,
  archived_at TEXT,
  CHECK ((project_id IS NULL) OR (category_id IS NULL))
);

CREATE TABLE IF NOT EXISTS week_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  archived_at TEXT
);

CREATE TABLE IF NOT EXISTS template_slots (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL REFERENCES week_templates(id),
  weekday INTEGER NOT NULL,
  slot_order INTEGER NOT NULL,
  kind TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  start_time TEXT
);

CREATE TABLE IF NOT EXISTS week_plans (
  id TEXT PRIMARY KEY,
  week_start TEXT NOT NULL UNIQUE,
  template_id TEXT NOT NULL,
  status TEXT NOT NULL,
  closed_at TEXT
);

CREATE TABLE IF NOT EXISTS week_slots (
  id TEXT PRIMARY KEY,
  week_plan_id TEXT NOT NULL REFERENCES week_plans(id),
  weekday INTEGER NOT NULL,
  slot_order INTEGER NOT NULL,
  kind TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  start_time TEXT
);

CREATE TABLE IF NOT EXISTS work_blocks (
  id TEXT PRIMARY KEY,
  week_plan_id TEXT NOT NULL REFERENCES week_plans(id),
  slot_id TEXT NOT NULL REFERENCES week_slots(id),
  task_id TEXT NOT NULL REFERENCES tasks(id),
  status TEXT NOT NULL,
  nominal_minutes INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  executed_at TEXT,
  cancelled_at TEXT
);

CREATE TABLE IF NOT EXISTS postponements (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  from_status TEXT NOT NULL,
  resume_week_start TEXT NOT NULL,
  created_at TEXT NOT NULL,
  resumed_at TEXT
);

CREATE TABLE IF NOT EXISTS postponement_resets (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS planning_proposals (
  id TEXT PRIMARY KEY,
  week_plan_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  accepted_at TEXT,
  payload_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS command_receipts (
  request_id TEXT PRIMARY KEY,
  payload_hash TEXT NOT NULL,
  capability_id TEXT NOT NULL,
  response_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS confirmation_tokens (
  token TEXT PRIMARY KEY,
  capability_id TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  summary TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  at TEXT NOT NULL,
  capability_id TEXT,
  request_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  payload_json TEXT NOT NULL
);
`;

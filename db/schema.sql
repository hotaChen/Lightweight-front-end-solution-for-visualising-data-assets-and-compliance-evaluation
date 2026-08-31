PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cn_name TEXT NOT NULL,
  domain TEXT NOT NULL,
  category TEXT NOT NULL,
  level TEXT NOT NULL,
  owner TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  risk_score REAL NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  compliance TEXT NOT NULL,
  risk_issue TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS fields (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  data_type TEXT NOT NULL,
  category TEXT NOT NULL,
  level TEXT NOT NULL,
  regulation TEXT NOT NULL,
  UNIQUE(asset_id, name)
);

CREATE TABLE IF NOT EXISTS lineage (
  upstream_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  downstream_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  PRIMARY KEY (upstream_id, downstream_id),
  CHECK (upstream_id <> downstream_id)
);

CREATE TABLE IF NOT EXISTS trend_points (
  month TEXT PRIMARY KEY,
  added INTEGER NOT NULL,
  changed INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS radar_scores (
  dimension TEXT PRIMARY KEY,
  score REAL NOT NULL CHECK (score BETWEEN 0 AND 100)
);

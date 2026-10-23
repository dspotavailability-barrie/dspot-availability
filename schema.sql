CREATE TABLE IF NOT EXISTS employee_codes (
  code TEXT PRIMARY KEY,
  employee_name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
);

CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_code TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  week_start TEXT NOT NULL,
  availability_text TEXT NOT NULL,
  submitted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (employee_code, week_start),
  FOREIGN KEY (employee_code) REFERENCES employee_codes(code)
);

CREATE INDEX IF NOT EXISTS idx_submissions_week ON submissions(week_start);

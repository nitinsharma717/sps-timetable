-- ── Tables ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS timetable_entries (
  id           TEXT PRIMARY KEY,
  course_id    TEXT    NOT NULL,
  subject_code TEXT    NOT NULL,
  subject_name TEXT    NOT NULL,
  faculty_ids  TEXT[]  NOT NULL DEFAULT '{}',
  day          TEXT    NOT NULL,
  start_time   TEXT    NOT NULL,
  duration     INTEGER NOT NULL CHECK (duration IN (1, 2, 3)),
  type         TEXT    NOT NULL CHECK (type IN ('theory', 'practical')),
  batch        TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faculty (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  short_code TEXT NOT NULL,
  department TEXT NOT NULL,
  email      TEXT,
  phone      TEXT
);

-- ── Row Level Security (allow all — no login required) ────────────────────────

ALTER TABLE timetable_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_all" ON timetable_entries FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_all" ON faculty FOR ALL USING (true) WITH CHECK (true);

-- ── Seed faculty ──────────────────────────────────────────────────────────────

INSERT INTO faculty (id, name, short_code, department) VALUES
  ('NS',    'Dr. Nisha Sharma',           'NS',    'Pharmaceutics'),
  ('PK',    'Dr. Pratima Katiyar',        'PK',    'Pharmaceutical Chemistry'),
  ('SU',    'Mrs. Swarnakshi Upadhyay',   'SU',    'Pharmaceutics'),
  ('MT',    'Dr. Mamta Tiwari',           'MT',    'Pharmacology'),
  ('SSV',   'Dr. Shweta Singh Verma',     'SSV',   'Pharmaceutical Chemistry'),
  ('RS',    'Dr. Richa Shukla',           'RS',    'Pharmacognosy'),
  ('ShS',   'Dr. Sharda Shakya',          'ShS',   'Pharmacognosy'),
  ('PNP',   'Dr. PN Pathak',              'PNP',   'Pharmacognosy'),
  ('AK',    'Dr. Ajay Kumar',             'AK',    'Pharmacognosy'),
  ('SKM',   'Dr. Shashi Kiran Misra',     'SKM',   'Pharmaceutics'),
  ('PT',    'Dr. Pallavi Tiwari',         'PT',    'Pharmaceutics'),
  ('AnK',   'Dr. Anupriya Kapoor',        'AnK',   'Pharmaceutics'),
  ('RiyS',  'Mrs. Riya Sachan',           'RiyS',  'Pharmaceutics'),
  ('ShV',   'Mr. Shivam Verma',           'ShV',   'Pharmaceutics'),
  ('Bi',    'Ms. Binish',                 'Bi',    'Pharmaceutics'),
  ('IS',    'Ms. Indu Singh',             'IS',    'Pharmacy Practice'),
  ('AR',    'Dr. A. Rajendiran',          'AR',    'Pharmaceutics'),
  ('KK',    'Dr. Kalpana',               'KK',    'Pharmaceutics'),
  ('AKG',   'Dr. Ajay Kumar Gupta',       'AKG',   'Pharmacology'),
  ('JNS',   'Dr. Jyoti Nanda Sharma',     'JNS',   'Pharmacognosy'),
  ('AnS',   'Dr. Anju Singh',             'AnS',   'Pharmacognosy'),
  ('RK',    'Mr. Rajesh Kumar',           'RK',    'Pharmacy Practice'),
  ('JK',    'Dr. Jay Kumar',              'JK',    'Pharmacology'),
  ('GS',    'Mr. Gaurav Srivastava',      'GS',    'Pharmaceutics'),
  ('AKS',   'Mr. Ajay Kumar Singh',       'AKS',   'Pharmacy Practice'),
  ('NK',    'Mr. Nikhil Kumar',           'NK',    'Pharmacology'),
  ('MG',    'Dr. Meenakshi Gupta',        'MG',    'Pharmaceutics'),
  ('AmS',   'Dr. Amrita Singh',           'AmS',   'Pharmaceutical Chemistry'),
  ('PCG',   'Dr. P.C. Gupta',             'PCG',   'Pharmacognosy'),
  ('BJ',    'Ms. Bhavya Jha',             'BJ',    'Pharmacy Practice'),
  ('ShivK', 'Mr. Shivam Kumar',           'ShivK', 'Pharmacy Practice'),
  ('SN',    'Ms. Suprabha Nishad',        'SN',    'Pharmacy Practice')
ON CONFLICT (id) DO NOTHING;

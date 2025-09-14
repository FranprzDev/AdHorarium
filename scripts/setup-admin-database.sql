-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  subject_number INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  career_id INTEGER REFERENCES careers(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(subject_number, career_id)
);

-- Create subject_correlatives table
CREATE TABLE IF NOT EXISTS subject_correlatives (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  prerequisite_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('must_approve', 'must_course')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(subject_id, prerequisite_id, type)
);

-- Create materialized view for complete subjects info
CREATE MATERIALIZED VIEW IF NOT EXISTS complete_subjects_info AS
SELECT 
  s.id,
  s.subject_number,
  s.name,
  s.career_id,
  s.level,
  c.name as career_name,
  s.created_at,
  s.updated_at
FROM subjects s
JOIN careers c ON s.career_id = c.id;

-- Create index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS complete_subjects_info_id_idx ON complete_subjects_info (id);
CREATE INDEX IF NOT EXISTS complete_subjects_info_career_idx ON complete_subjects_info (career_id);
CREATE INDEX IF NOT EXISTS complete_subjects_info_level_idx ON complete_subjects_info (level);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_complete_subjects_info()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY complete_subjects_info;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers to refresh the materialized view
DROP TRIGGER IF EXISTS refresh_subjects_view ON subjects;
CREATE TRIGGER refresh_subjects_view
  AFTER INSERT OR UPDATE OR DELETE ON subjects
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_complete_subjects_info();

DROP TRIGGER IF EXISTS refresh_careers_view ON careers;
CREATE TRIGGER refresh_careers_view
  AFTER INSERT OR UPDATE OR DELETE ON careers
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_complete_subjects_info();

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_correlatives ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_users
CREATE POLICY "Admin users can view admin_users" ON admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid()
    )
  );

-- RLS Policies for subjects
CREATE POLICY "Anyone can view subjects" ON subjects FOR SELECT USING (true);

CREATE POLICY "Only admins can insert subjects" ON subjects
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid()
    )
  );

CREATE POLICY "Only admins can update subjects" ON subjects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid()
    )
  );

CREATE POLICY "Only admins can delete subjects" ON subjects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid()
    )
  );

-- RLS Policies for subject_correlatives
CREATE POLICY "Anyone can view subject_correlatives" ON subject_correlatives FOR SELECT USING (true);

CREATE POLICY "Only admins can insert subject_correlatives" ON subject_correlatives
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid()
    )
  );

CREATE POLICY "Only admins can update subject_correlatives" ON subject_correlatives
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid()
    )
  );

CREATE POLICY "Only admins can delete subject_correlatives" ON subject_correlatives
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid()
    )
  );

-- Initial refresh of the materialized view
REFRESH MATERIALIZED VIEW complete_subjects_info;

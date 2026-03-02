-- AdHorarium - Neon Database Schema
-- Run this script once to set up all tables

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Careers table
CREATE TABLE IF NOT EXISTS careers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exam tables
CREATE TABLE IF NOT EXISTS exam_tables (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (custom auth - email/password + Google OAuth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  full_name TEXT,
  avatar_url TEXT,
  google_id TEXT UNIQUE,
  provider TEXT NOT NULL DEFAULT 'email',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions (HTTP-only cookie sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  career_id INTEGER REFERENCES careers(id),
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subjects
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  career_id INTEGER REFERENCES careers(id),
  exam_table_id INTEGER REFERENCES exam_tables(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, career_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_subjects_career_id ON subjects(career_id);

-- Seed: Careers
INSERT INTO careers (name, code) VALUES
  ('Ingeniería en Sistemas de Información', 'ISI'),
  ('Ingeniería Electrónica', 'IE'),
  ('Ingeniería Civil', 'IC'),
  ('Ingeniería Mecánica', 'IM'),
  ('Ingeniería en Energía Eléctrica', 'IEE'),
  ('Ciclo Básico', 'CB')
ON CONFLICT (code) DO NOTHING;

-- Seed: Exam tables
INSERT INTO exam_tables (name, description) VALUES
  ('Mesa I', 'Primera mesa de examen'),
  ('Mesa II', 'Segunda mesa de examen'),
  ('Mesa III', 'Tercera mesa de examen')
ON CONFLICT DO NOTHING;

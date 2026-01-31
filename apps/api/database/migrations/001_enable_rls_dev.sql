-- ============================================================
-- Migration 001 (DEV): Enable Row Level Security - Development Mode
-- ============================================================
-- WARNING: This is for DEVELOPMENT ONLY!
-- These policies are PERMISSIVE and allow all operations.
-- Use 001_enable_rls.sql for production.
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE IF EXISTS students ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS video_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS challenge_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS student_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS trails ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS trail_videos ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- DEVELOPMENT POLICIES - Allow everything
-- ============================================================

-- Students
DROP POLICY IF EXISTS "dev_students_all" ON students;
CREATE POLICY "dev_students_all" ON students FOR ALL USING (true) WITH CHECK (true);

-- Video Sessions
DROP POLICY IF EXISTS "dev_video_sessions_all" ON video_sessions;
CREATE POLICY "dev_video_sessions_all" ON video_sessions FOR ALL USING (true) WITH CHECK (true);

-- Challenge Attempts
DROP POLICY IF EXISTS "dev_challenge_attempts_all" ON challenge_attempts;
CREATE POLICY "dev_challenge_attempts_all" ON challenge_attempts FOR ALL USING (true) WITH CHECK (true);

-- Achievements
DROP POLICY IF EXISTS "dev_achievements_all" ON achievements;
CREATE POLICY "dev_achievements_all" ON achievements FOR ALL USING (true) WITH CHECK (true);

-- Student Achievements
DROP POLICY IF EXISTS "dev_student_achievements_all" ON student_achievements;
CREATE POLICY "dev_student_achievements_all" ON student_achievements FOR ALL USING (true) WITH CHECK (true);

-- Certificates
DROP POLICY IF EXISTS "dev_certificates_all" ON certificates;
CREATE POLICY "dev_certificates_all" ON certificates FOR ALL USING (true) WITH CHECK (true);

-- Trails
DROP POLICY IF EXISTS "dev_trails_all" ON trails;
CREATE POLICY "dev_trails_all" ON trails FOR ALL USING (true) WITH CHECK (true);

-- Trail Videos
DROP POLICY IF EXISTS "dev_trail_videos_all" ON trail_videos;
CREATE POLICY "dev_trail_videos_all" ON trail_videos FOR ALL USING (true) WITH CHECK (true);

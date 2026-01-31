-- ============================================================
-- Migration 001: Enable Row Level Security (RLS)
-- ============================================================
-- This migration enables RLS on all tables and creates policies
-- for secure data access based on authenticated users.
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
-- STUDENTS TABLE POLICIES
-- ============================================================

-- Users can read their own profile
DROP POLICY IF EXISTS "students_select_own" ON students;
CREATE POLICY "students_select_own" ON students
    FOR SELECT
    USING (auth.uid()::text = id::text);

-- Users can update their own profile
DROP POLICY IF EXISTS "students_update_own" ON students;
CREATE POLICY "students_update_own" ON students
    FOR UPDATE
    USING (auth.uid()::text = id::text);

-- Allow insert for new user registration (service role handles this)
DROP POLICY IF EXISTS "students_insert_authenticated" ON students;
CREATE POLICY "students_insert_authenticated" ON students
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- VIDEO_SESSIONS TABLE POLICIES
-- ============================================================

-- Users can read their own sessions
DROP POLICY IF EXISTS "video_sessions_select_own" ON video_sessions;
CREATE POLICY "video_sessions_select_own" ON video_sessions
    FOR SELECT
    USING (
        student_id IN (
            SELECT id FROM students WHERE auth.uid()::text = id::text
        )
    );

-- Users can create sessions for themselves
DROP POLICY IF EXISTS "video_sessions_insert_own" ON video_sessions;
CREATE POLICY "video_sessions_insert_own" ON video_sessions
    FOR INSERT
    WITH CHECK (
        student_id IN (
            SELECT id FROM students WHERE auth.uid()::text = id::text
        )
    );

-- Users can update their own sessions
DROP POLICY IF EXISTS "video_sessions_update_own" ON video_sessions;
CREATE POLICY "video_sessions_update_own" ON video_sessions
    FOR UPDATE
    USING (
        student_id IN (
            SELECT id FROM students WHERE auth.uid()::text = id::text
        )
    );

-- ============================================================
-- CHALLENGE_ATTEMPTS TABLE POLICIES
-- ============================================================

-- Users can read their own attempts
DROP POLICY IF EXISTS "challenge_attempts_select_own" ON challenge_attempts;
CREATE POLICY "challenge_attempts_select_own" ON challenge_attempts
    FOR SELECT
    USING (
        session_id IN (
            SELECT vs.id FROM video_sessions vs
            JOIN students s ON vs.student_id = s.id
            WHERE auth.uid()::text = s.id::text
        )
    );

-- Users can create attempts for their sessions
DROP POLICY IF EXISTS "challenge_attempts_insert_own" ON challenge_attempts;
CREATE POLICY "challenge_attempts_insert_own" ON challenge_attempts
    FOR INSERT
    WITH CHECK (
        session_id IN (
            SELECT vs.id FROM video_sessions vs
            JOIN students s ON vs.student_id = s.id
            WHERE auth.uid()::text = s.id::text
        )
    );

-- ============================================================
-- ACHIEVEMENTS TABLE POLICIES (Public Read)
-- ============================================================

-- Everyone can read achievements (they are public definitions)
DROP POLICY IF EXISTS "achievements_select_all" ON achievements;
CREATE POLICY "achievements_select_all" ON achievements
    FOR SELECT
    USING (true);

-- Only service role can modify achievements (handled at API level)

-- ============================================================
-- STUDENT_ACHIEVEMENTS TABLE POLICIES
-- ============================================================

-- Users can read their own unlocked achievements
DROP POLICY IF EXISTS "student_achievements_select_own" ON student_achievements;
CREATE POLICY "student_achievements_select_own" ON student_achievements
    FOR SELECT
    USING (
        student_id IN (
            SELECT id FROM students WHERE auth.uid()::text = id::text
        )
    );

-- Service role handles inserts (unlocking achievements)

-- ============================================================
-- CERTIFICATES TABLE POLICIES
-- ============================================================

-- Public read for certificate verification
DROP POLICY IF EXISTS "certificates_select_public" ON certificates;
CREATE POLICY "certificates_select_public" ON certificates
    FOR SELECT
    USING (true);

-- Users can only see full details of their own certificates
DROP POLICY IF EXISTS "certificates_select_own_details" ON certificates;
CREATE POLICY "certificates_select_own_details" ON certificates
    FOR SELECT
    USING (
        student_id IN (
            SELECT id FROM students WHERE auth.uid()::text = id::text
        )
    );

-- ============================================================
-- TRAILS TABLE POLICIES
-- ============================================================

-- Everyone can read published trails
DROP POLICY IF EXISTS "trails_select_published" ON trails;
CREATE POLICY "trails_select_published" ON trails
    FOR SELECT
    USING (true);

-- Instructors can manage their own trails
DROP POLICY IF EXISTS "trails_manage_own" ON trails;
CREATE POLICY "trails_manage_own" ON trails
    FOR ALL
    USING (
        instructor_id IN (
            SELECT id FROM students WHERE auth.uid()::text = id::text
        )
    );

-- ============================================================
-- TRAIL_VIDEOS TABLE POLICIES
-- ============================================================

-- Everyone can read trail videos
DROP POLICY IF EXISTS "trail_videos_select_all" ON trail_videos;
CREATE POLICY "trail_videos_select_all" ON trail_videos
    FOR SELECT
    USING (true);

-- Trail owners can manage videos
DROP POLICY IF EXISTS "trail_videos_manage_own" ON trail_videos;
CREATE POLICY "trail_videos_manage_own" ON trail_videos
    FOR ALL
    USING (
        trail_id IN (
            SELECT t.id FROM trails t
            JOIN students s ON t.instructor_id = s.id
            WHERE auth.uid()::text = s.id::text
        )
    );

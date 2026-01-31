
-- ==========================================================
-- Row Level Security (RLS) - MODO DESENVOLVIMENTO
-- ==========================================================
-- ATENÇÃO: Estas políticas são PERMISSIVAS para desenvolvimento.
-- Execute setup_rls_auth.sql quando implementar autenticação!
-- ==========================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- ==========================================================
-- STUDENTS - Permissivo (desenvolvimento)
-- ==========================================================

-- Permitir SELECT para todos (leitura pública)
DROP POLICY IF EXISTS "dev_students_select" ON students;
CREATE POLICY "dev_students_select" ON students
    FOR SELECT USING (true);

-- Permitir INSERT para todos (criação livre)
DROP POLICY IF EXISTS "dev_students_insert" ON students;
CREATE POLICY "dev_students_insert" ON students
    FOR INSERT WITH CHECK (true);

-- Permitir UPDATE para todos (atualização livre)
DROP POLICY IF EXISTS "dev_students_update" ON students;
CREATE POLICY "dev_students_update" ON students
    FOR UPDATE USING (true);

-- ==========================================================
-- VIDEO_SESSIONS - Permissivo (desenvolvimento)
-- ==========================================================

DROP POLICY IF EXISTS "dev_video_sessions_select" ON video_sessions;
CREATE POLICY "dev_video_sessions_select" ON video_sessions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "dev_video_sessions_insert" ON video_sessions;
CREATE POLICY "dev_video_sessions_insert" ON video_sessions
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "dev_video_sessions_update" ON video_sessions;
CREATE POLICY "dev_video_sessions_update" ON video_sessions
    FOR UPDATE USING (true);

-- ==========================================================
-- CHALLENGE_ATTEMPTS - Permissivo (desenvolvimento)
-- ==========================================================

DROP POLICY IF EXISTS "dev_challenge_attempts_select" ON challenge_attempts;
CREATE POLICY "dev_challenge_attempts_select" ON challenge_attempts
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "dev_challenge_attempts_insert" ON challenge_attempts;
CREATE POLICY "dev_challenge_attempts_insert" ON challenge_attempts
    FOR INSERT WITH CHECK (true);

-- ==========================================================
-- ACHIEVEMENTS - Leitura pública, escrita restrita
-- ==========================================================

-- Todos podem ler achievements
DROP POLICY IF EXISTS "achievements_select_all" ON achievements;
CREATE POLICY "achievements_select_all" ON achievements
    FOR SELECT USING (true);

-- Apenas service_role pode inserir/atualizar achievements
-- (isso é controlado pelo backend usando SERVICE_ROLE_KEY)

-- ==========================================================
-- STUDENT_ACHIEVEMENTS - Permissivo (desenvolvimento)
-- ==========================================================

DROP POLICY IF EXISTS "dev_student_achievements_select" ON student_achievements;
CREATE POLICY "dev_student_achievements_select" ON student_achievements
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "dev_student_achievements_insert" ON student_achievements;
CREATE POLICY "dev_student_achievements_insert" ON student_achievements
    FOR INSERT WITH CHECK (true);

-- ==========================================================
-- CERTIFICATES - Leitura pública, escrita controlada
-- ==========================================================

-- Todos podem ler certificados (para validação pública)
DROP POLICY IF EXISTS "certificates_select_all" ON certificates;
CREATE POLICY "certificates_select_all" ON certificates
    FOR SELECT USING (true);

-- Inserção controlada pelo backend
DROP POLICY IF EXISTS "dev_certificates_insert" ON certificates;
CREATE POLICY "dev_certificates_insert" ON certificates
    FOR INSERT WITH CHECK (true);

"""
Script para configurar Row Level Security (RLS) no Supabase

Este script habilita RLS e cria políticas de segurança para todas as tabelas.

IMPORTANTE: Atualmente usa políticas PERMISSIVAS para desenvolvimento.
Quando implementar autenticação, execute a versão com AUTH habilitada.

Usage:
    python -m database.setup_rls
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.supabase_client import get_supabase_client


# Políticas RLS - Versão de Desenvolvimento (Permissiva)
RLS_DEV_SQL = """
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
"""


# Políticas RLS - Versão com Autenticação (Para o futuro)
RLS_AUTH_SQL = """
-- ==========================================================
-- Row Level Security (RLS) - MODO PRODUÇÃO (COM AUTH)
-- ==========================================================
-- Execute este SQL quando implementar Supabase Auth
-- ==========================================================

-- Habilitar RLS (se ainda não habilitado)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- ==========================================================
-- STUDENTS - Usuário vê apenas seus próprios dados
-- ==========================================================

-- Remover políticas de desenvolvimento
DROP POLICY IF EXISTS "dev_students_select" ON students;
DROP POLICY IF EXISTS "dev_students_insert" ON students;
DROP POLICY IF EXISTS "dev_students_update" ON students;

-- Usuários podem ver apenas seus próprios dados
DROP POLICY IF EXISTS "auth_students_select_own" ON students;
CREATE POLICY "auth_students_select_own" ON students
    FOR SELECT USING (auth.uid() = id);

-- Usuários podem atualizar apenas seus próprios dados
DROP POLICY IF EXISTS "auth_students_update_own" ON students;
CREATE POLICY "auth_students_update_own" ON students
    FOR UPDATE USING (auth.uid() = id);

-- Novos usuários criam seu perfil automaticamente
DROP POLICY IF EXISTS "auth_students_insert_own" ON students;
CREATE POLICY "auth_students_insert_own" ON students
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ==========================================================
-- VIDEO_SESSIONS - Usuário vê apenas suas sessões
-- ==========================================================

DROP POLICY IF EXISTS "dev_video_sessions_select" ON video_sessions;
DROP POLICY IF EXISTS "dev_video_sessions_insert" ON video_sessions;
DROP POLICY IF EXISTS "dev_video_sessions_update" ON video_sessions;

DROP POLICY IF EXISTS "auth_video_sessions_select_own" ON video_sessions;
CREATE POLICY "auth_video_sessions_select_own" ON video_sessions
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM students WHERE id = video_sessions.student_id
        )
    );

DROP POLICY IF EXISTS "auth_video_sessions_insert_own" ON video_sessions;
CREATE POLICY "auth_video_sessions_insert_own" ON video_sessions
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT id FROM students WHERE id = video_sessions.student_id
        )
    );

DROP POLICY IF EXISTS "auth_video_sessions_update_own" ON video_sessions;
CREATE POLICY "auth_video_sessions_update_own" ON video_sessions
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT id FROM students WHERE id = video_sessions.student_id
        )
    );

-- ==========================================================
-- CHALLENGE_ATTEMPTS - Usuário vê apenas suas tentativas
-- ==========================================================

DROP POLICY IF EXISTS "dev_challenge_attempts_select" ON challenge_attempts;
DROP POLICY IF EXISTS "dev_challenge_attempts_insert" ON challenge_attempts;

DROP POLICY IF EXISTS "auth_challenge_attempts_select_own" ON challenge_attempts;
CREATE POLICY "auth_challenge_attempts_select_own" ON challenge_attempts
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM video_sessions 
            WHERE student_id IN (
                SELECT id FROM students WHERE id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "auth_challenge_attempts_insert_own" ON challenge_attempts;
CREATE POLICY "auth_challenge_attempts_insert_own" ON challenge_attempts
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT id FROM video_sessions 
            WHERE student_id IN (
                SELECT id FROM students WHERE id = auth.uid()
            )
        )
    );

-- ==========================================================
-- ACHIEVEMENTS - Leitura pública (não muda)
-- ==========================================================

-- Todos podem ler achievements (já configurado)

-- ==========================================================
-- STUDENT_ACHIEVEMENTS - Usuário vê apenas suas conquistas
-- ==========================================================

DROP POLICY IF EXISTS "dev_student_achievements_select" ON student_achievements;
DROP POLICY IF EXISTS "dev_student_achievements_insert" ON student_achievements;

DROP POLICY IF EXISTS "auth_student_achievements_select_own" ON student_achievements;
CREATE POLICY "auth_student_achievements_select_own" ON student_achievements
    FOR SELECT USING (
        student_id IN (
            SELECT id FROM students WHERE id = auth.uid()
        )
    );

-- Insert é controlado pelo backend (service_role)

-- ==========================================================
-- CERTIFICATES - Leitura pública (para validação)
-- ==========================================================

-- Todos podem ler certificados (para validação pública)
-- Já configurado, não precisa mudar

-- Usuários podem ver apenas seus próprios certificados em queries privadas
DROP POLICY IF EXISTS "auth_certificates_select_own" ON certificates;
CREATE POLICY "auth_certificates_select_own" ON certificates
    FOR SELECT USING (
        true  -- Mantém público para validação
        -- OU student_id IN (SELECT id FROM students WHERE id = auth.uid())
        -- Se quiser restringir
    );
"""


def create_rls_file(mode="dev"):
    """Cria arquivo SQL com as políticas RLS"""
    output_file = os.path.join(
        os.path.dirname(__file__),
        f'rls_{mode}.sql'
    )
    
    sql_content = RLS_DEV_SQL if mode == "dev" else RLS_AUTH_SQL
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(sql_content)
    
    return output_file


def main():
    """Main function"""
    print("=" * 70)
    print("  SETUP DE ROW LEVEL SECURITY (RLS) - Your-Edu-Interativo")
    print("=" * 70)
    print()
    
    print("⚠️  IMPORTANTE: Escolha o modo de RLS adequado\n")
    print("📋 Modos disponíveis:\n")
    print("1. DESENVOLVIMENTO - Políticas permissivas (sem autenticação)")
    print("   → Use durante desenvolvimento local")
    print("   → Permite acesso total a todas as tabelas")
    print("   → ⚠️  NÃO use em produção!\n")
    
    print("2. PRODUÇÃO (COM AUTH) - Políticas restritivas")
    print("   → Para quando implementar Supabase Auth")
    print("   → Usuários veem apenas seus próprios dados")
    print("   → ✅ Seguro para produção\n")
    
    print("=" * 70)
    print()
    
    choice = input("Escolha o modo [1=DEV / 2=PROD]: ").strip()
    
    if choice == "1":
        mode = "dev"
        print("\n🔓 Criando políticas de DESENVOLVIMENTO (permissivas)...")
    elif choice == "2":
        mode = "auth"
        print("\n🔐 Criando políticas de PRODUÇÃO (com autenticação)...")
    else:
        print("❌ Opção inválida!")
        sys.exit(1)
    
    # Criar arquivo SQL
    sql_file = create_rls_file(mode)
    print(f"\n✅ Arquivo SQL gerado: {sql_file}\n")
    
    print("=" * 70)
    print("  📋 PRÓXIMOS PASSOS")
    print("=" * 70)
    print()
    print("1️⃣  Abra o Supabase SQL Editor:")
    print("    https://supabase.com → Seu Projeto → SQL Editor\n")
    
    print("2️⃣  Clique em 'New query'\n")
    
    print(f"3️⃣  Cole o conteúdo do arquivo:")
    print(f"    {sql_file}\n")
    
    print("4️⃣  Clique em 'Run' (ou CMD/CTRL + Enter)\n")
    
    print("5️⃣  Verifique se não há erros\n")
    
    print("6️⃣  Atualize a página do Table Editor para ver RLS ativo\n")
    
    if mode == "dev":
        print("⚠️  LEMBRETE: Mude para políticas de PRODUÇÃO antes de fazer deploy!")
        print("   Execute este script novamente escolhendo opção 2\n")
    
    print("=" * 70)
    
    print(f"\n📄 Conteúdo do arquivo {sql_file}:\n")
    print("-" * 70)
    with open(sql_file, 'r', encoding='utf-8') as f:
        print(f.read())
    print("-" * 70)


if __name__ == "__main__":
    main()

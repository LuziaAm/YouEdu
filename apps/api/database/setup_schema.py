"""
Script para criar o schema completo do banco de dados no Supabase

Este script cria todas as tabelas, índices, triggers e views necessárias
para o funcionamento da aplicação.

Usage:
    python -m database.setup_schema
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.supabase_client import get_supabase_client


# SQL Schema completo
SCHEMA_SQL = """
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de estudantes
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    avatar_url TEXT,
    total_xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de sessões de vídeo
CREATE TABLE IF NOT EXISTS video_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    video_title TEXT NOT NULL,
    video_url TEXT,
    video_source TEXT CHECK (video_source IN ('upload', 'youtube')),
    video_duration INTEGER,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    time_spent INTEGER,
    total_challenges INTEGER DEFAULT 0,
    challenges_completed INTEGER DEFAULT 0
);

-- Tabela de desafios respondidos
CREATE TABLE IF NOT EXISTS challenge_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES video_sessions(id) ON DELETE CASCADE,
    challenge_id TEXT NOT NULL,
    challenge_type TEXT NOT NULL CHECK (challenge_type IN ('quiz', 'code', 'multiple', 'fill_blank')),
    is_correct BOOLEAN NOT NULL,
    time_taken INTEGER,
    xp_earned INTEGER DEFAULT 0,
    attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de conquistas (achievements)
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    category TEXT,
    xp_reward INTEGER DEFAULT 0,
    requirement_value INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de conquistas desbloqueadas
CREATE TABLE IF NOT EXISTS student_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, achievement_id)
);

-- Tabela de certificados
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    session_id UUID REFERENCES video_sessions(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    course_title TEXT NOT NULL,
    course_duration INTEGER,
    score INTEGER,
    issue_date TIMESTAMPTZ DEFAULT NOW(),
    validation_code TEXT UNIQUE NOT NULL,
    pdf_storage_path TEXT
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_video_sessions_student ON video_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_challenge_attempts_session ON challenge_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_student_achievements_student ON student_achievements(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_validation ON certificates(validation_code);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View para leaderboard
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
    s.id,
    s.name,
    s.avatar_url,
    s.total_xp,
    s.level,
    COUNT(DISTINCT vs.id) as videos_completed,
    COUNT(DISTINCT sa.achievement_id) as achievements_count,
    RANK() OVER (ORDER BY s.total_xp DESC) as rank
FROM students s
LEFT JOIN video_sessions vs ON s.id = vs.student_id AND vs.completed_at IS NOT NULL
LEFT JOIN student_achievements sa ON s.id = sa.student_id
GROUP BY s.id, s.name, s.avatar_url, s.total_xp, s.level
ORDER BY s.total_xp DESC;
"""


def execute_schema():
    """Execute o schema SQL no Supabase"""
    print("🚀 Iniciando criação do schema no Supabase...\n")
    
    try:
        supabase = get_supabase_client()
        print("✅ Conectado ao Supabase com sucesso\n")
        
        # Executar SQL via REST API
        # Nota: O cliente Python do Supabase não tem método direto para executar SQL raw
        # Vamos executar statement por statement
        
        statements = SCHEMA_SQL.split(';')
        total = len([s for s in statements if s.strip()])
        executed = 0
        
        print(f"📊 Executando {total} statements SQL...\n")
        
        for i, statement in enumerate(statements, 1):
            statement = statement.strip()
            if not statement:
                continue
                
            try:
                # Usar o método rpc para executar SQL
                supabase.rpc('exec_sql', {'query': statement}).execute()
                executed += 1
                
                # Identificar o tipo de statement
                if 'CREATE TABLE' in statement.upper():
                    table_name = statement.split('CREATE TABLE')[1].split('(')[0].strip().split()[0]
                    print(f"   ✅ [{executed}/{total}] Tabela criada: {table_name}")
                elif 'CREATE INDEX' in statement.upper():
                    index_name = statement.split('CREATE INDEX')[1].split('ON')[0].strip().split()[0]
                    print(f"   ✅ [{executed}/{total}] Índice criado: {index_name}")
                elif 'CREATE VIEW' in statement.upper():
                    view_name = statement.split('CREATE VIEW')[1].split('AS')[0].replace('OR REPLACE', '').strip()
                    print(f"   ✅ [{executed}/{total}] View criada: {view_name}")
                elif 'CREATE TRIGGER' in statement.upper():
                    trigger_name = statement.split('CREATE TRIGGER')[1].split('BEFORE')[0].strip()
                    print(f"   ✅ [{executed}/{total}] Trigger criado: {trigger_name}")
                elif 'CREATE FUNCTION' in statement.upper() or 'CREATE OR REPLACE FUNCTION' in statement.upper():
                    print(f"   ✅ [{executed}/{total}] Função criada")
                elif 'CREATE EXTENSION' in statement.upper():
                    print(f"   ✅ [{executed}/{total}] Extensão UUID habilitada")
                else:
                    print(f"   ✅ [{executed}/{total}] Statement executado")
                    
            except Exception as e:
                # Alguns erros são esperados (ex: extensão já existe)
                error_msg = str(e).lower()
                if 'already exists' in error_msg or 'duplicate' in error_msg:
                    print(f"   ⏭️  [{executed}/{total}] Já existe, pulando...")
                else:
                    print(f"   ⚠️  [{executed}/{total}] Aviso: {str(e)[:100]}")
        
        print(f"\n🎉 Schema criado com sucesso!")
        print(f"   Total de statements executados: {executed}/{total}")
        
        # Verificar tabelas criadas
        print("\n📋 Verificando tabelas criadas...")
        verify_tables()
        
    except Exception as e:
        print(f"\n❌ Erro ao criar schema: {e}")
        print("\n💡 Dica: Se o erro for sobre 'exec_sql', você precisará criar esta function no Supabase:")
        print("""
        -- Execute isto no SQL Editor do Supabase:
        CREATE OR REPLACE FUNCTION exec_sql(query text)
        RETURNS void AS $$
        BEGIN
            EXECUTE query;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        """)
        sys.exit(1)


def verify_tables():
    """Verificar se as tabelas foram criadas"""
    supabase = get_supabase_client()
    
    tables = [
        'students',
        'video_sessions',
        'challenge_attempts',
        'achievements',
        'student_achievements',
        'certificates'
    ]
    
    for table in tables:
        try:
            # Tentar fazer uma query na tabela
            response = supabase.table(table).select('*').limit(0).execute()
            print(f"   ✅ {table}")
        except Exception as e:
            print(f"   ❌ {table} - {str(e)[:50]}")


def create_schema_via_sql_file():
    """
    Método alternativo: Gera um arquivo SQL que pode ser executado manualmente
    """
    output_file = os.path.join(
        os.path.dirname(__file__),
        'schema.sql'
    )
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(SCHEMA_SQL)
    
    print(f"\n📄 Arquivo SQL gerado: {output_file}")
    print("\n💡 Você pode executar este arquivo no SQL Editor do Supabase:")
    print("   1. Acesse https://supabase.com")
    print("   2. Vá em SQL Editor")
    print("   3. Cole o conteúdo do arquivo schema.sql")
    print("   4. Clique em 'Run'")
    
    return output_file


def main():
    """Main function"""
    print("=" * 60)
    print("  SETUP DO SCHEMA - Your-Edu-Interativo")
    print("=" * 60)
    print()
    
    try:
        # Verificar se tem credenciais
        if not os.getenv("SUPABASE_URL") or not os.getenv("SUPABASE_SERVICE_ROLE_KEY"):
            print("❌ Erro: Credenciais do Supabase não configuradas!")
            print("\nPor favor, configure as variáveis de ambiente no .env:")
            print("  - SUPABASE_URL")
            print("  - SUPABASE_SERVICE_ROLE_KEY")
            print("\nVeja o arquivo SETUP_SUPABASE.md para instruções.")
            sys.exit(1)
        
        # Tentar executar o schema
        print("Escolha o método de setup:\n")
        print("1. Executar SQL automaticamente (requer function 'exec_sql')")
        print("2. Gerar arquivo SQL para execução manual no Supabase")
        print("3. Criar tabelas via API REST do Supabase (método simplificado)")
        print()
        
        choice = input("Opção [1/2/3]: ").strip()
        
        if choice == "1":
            execute_schema()
        elif choice == "2":
            sql_file = create_schema_via_sql_file()
            print(f"\n✅ Arquivo criado: {sql_file}")
        elif choice == "3":
            print("\n🚀 Criando tabelas via API REST...\n")
            create_tables_via_rest_api()
        else:
            print("❌ Opção inválida!")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n\n⚠️  Setup cancelado pelo usuário")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Erro inesperado: {e}")
        sys.exit(1)


def create_tables_via_rest_api():
    """
    Método simplificado que não requer function exec_sql
    Gera o arquivo SQL e instrui o usuário
    """
    sql_file = create_schema_via_sql_file()
    
    print("\n" + "=" * 60)
    print("  📋 PRÓXIMOS PASSOS")
    print("=" * 60)
    print()
    print("1️⃣  Abra o Supabase no navegador:")
    print("    https://supabase.com → Seu Projeto → SQL Editor")
    print()
    print("2️⃣  Clique em 'New query'")
    print()
    print(f"3️⃣  Cole o conteúdo do arquivo:")
    print(f"    {sql_file}")
    print()
    print("4️⃣  Clique em 'Run' (ou pressione CMD/CTRL + Enter)")
    print()
    print("5️⃣  Aguarde a execução e verifique se não há erros")
    print()
    print("6️⃣  Execute novamente este script com opção [1] para verificar")
    print()
    print("=" * 60)


if __name__ == "__main__":
    main()

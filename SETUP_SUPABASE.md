# Guia de Configuração do Supabase - Your-Edu-Interativo

## 📋 Pré-requisitos
- Conta no Supabase (gratuita): https://supabase.com
- Navegador web

---

## 🚀 Passo 1: Criar Projeto no Supabase

1. Acesse https://supabase.com e faça login
2. Clique em **"New Project"**
3. Preencha os dados:
   - **Name**: `your-edu-interativo` (ou nome de sua preferência)
   - **Database Password**: Escolha uma senha forte (salve em local seguro!)
   - **Region**: Escolha a mais próxima (ex: `South America (São Paulo)`)
   - **Pricing Plan**: `Free` (adequado para desenvolvimento)
4. Clique em **"Create new project"**
5. Aguarde ~2 minutos enquanto o projeto é configurado

---

## 📊 Passo 2: Criar Schema do Banco de Dados

1. No painel do projeto, vá para **"SQL Editor"** (menu lateral)
2. Clique em **"+ New query"**
3. Cole o SQL abaixo e clique em **"Run"**:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de estudantes
CREATE TABLE students (
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
CREATE TABLE video_sessions (
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
CREATE TABLE challenge_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES video_sessions(id) ON DELETE CASCADE,
    challenge_id TEXT NOT NULL,
    challenge_type TEXT NOT NULL CHECK (challenge_type IN ('quiz', 'code', 'multiple', 'fill_blank')),
    is_correct BOOLEAN NOT NULL,
    time_taken INTEGER,
    xp_earned INTEGER DEFAULT 0,
    attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de conquistas
CREATE TABLE achievements (
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
CREATE TABLE student_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, achievement_id)
);

-- Tabela de certificados
CREATE TABLE certificates (
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
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_video_sessions_student ON video_sessions(student_id);
CREATE INDEX idx_challenge_attempts_session ON challenge_attempts(session_id);
CREATE INDEX idx_student_achievements_student ON student_achievements(student_id);
CREATE INDEX idx_certificates_validation ON certificates(validation_code);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View para leaderboard
CREATE VIEW leaderboard AS
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
```

4. Verifique se a query foi executada com sucesso (✅ Success)

---

## 🗂️ Passo 3: Configurar Storage para Certificados

1. No menu lateral, vá para **"Storage"**
2. Clique em **"Create a new bucket"**
3. Preencha:
   - **Name**: `certificates`
   - **Public bucket**: Marque esta opção ✅ (para permitir downloads públicos)
4. Clique em **"Create bucket"**

---

## 🔑 Passo 4: Obter Credenciais

1. No menu lateral, vá para **"Settings" → "API"**
2. Você verá duas informações importantes:

   **Project URL**:  
   ```
   https://xxxxx.supabase.co
   ```

   **anon/public key**:  
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **COPIE ESTAS DUAS INFORMAÇÕES** - você vai precisar delas!

---

## ⚙️ Passo 5: Configurar Variáveis de Ambiente

Adicione as credenciais do Supabase no arquivo `.env` na raiz do projeto:

```env
# Existing
GEMINI_API_KEY=AIzaSyBjPdAH-roL0nmbxN0D4Bp_3fipbL4t0Ao
CORS_ORIGINS=http://localhost:5173,http://localhost:5174

# Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> ⚠️ **IMPORTANTE**: O `SUPABASE_SERVICE_ROLE_KEY` está na mesma página, em **"service_role key"**. Esta chave tem privilégios administrativos e deve ser usada APENAS no backend!

---

## 📦 Passo 6: Instalar Dependências

### Backend (Python)
```bash
cd apps/api
source venv/bin/activate
pip install supabase postgrest
```

### Frontend (TypeScript)
```bash
cd apps/web
npm install @supabase/supabase-js
```

---

## ✅ Passo 7: Testar Conexão

Execute o teste rápido para verificar se tudo está funcionando:

```bash
cd apps/api
python -c "from supabase import create_client; import os; client = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_ANON_KEY')); print('✅ Conexão Supabase OK!')"
```

Se ver a mensagem `✅ Conexão Supabase OK!`, está tudo certo!

---

## 🎯 Próximos Passos

Agora que o Supabase está configurado, podemos:
1. ✅ Implementar cliente Supabase no backend
2. ✅ Implementar cliente Supabase no frontend
3. ✅ Criar seeds de achievements
4. ✅ Começar a implementação das features

---

## 📚 Recursos Úteis

- [Documentação Supabase](https://supabase.com/docs)
- [Supabase Python Client](https://supabase.com/docs/reference/python/introduction)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [SQL Editor](https://supabase.com/docs/guides/database/overview)
- [Storage](https://supabase.com/docs/guides/storage)

---

## 🆘 Troubleshooting

### Erro: "relation does not exist"
- Verifique se executou todo o SQL do Passo 2
- Vá em "Table Editor" e veja se as tabelas foram criadas

### Erro: "Invalid API key"
- Verifique se copiou as chaves corretas
- As chaves NÃO devem ter espaços
- Use aspas duplas no `.env` se a chave tiver caracteres especiais

### Erro de CORS
- Adicione `http://localhost:5173` nas allowed origins do Supabase
- Vá em Settings → API → CORS Origins

---

**Status**: ✅ Configuração completa!

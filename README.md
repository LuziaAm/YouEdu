# YouEdu

Plataforma de aprendizado inteligente com IA que transforma vídeos em experiências educacionais gamificadas.

## Estrutura do Monorepo

```
youedu/
├── apps/
│   ├── web/          # Frontend React + Vite + TypeScript
│   └── api/          # Backend FastAPI + Python
└── package.json      # Orquestração do monorepo
```

## Funcionalidades

- **Análise de Vídeos**: Upload de vídeos locais ou URLs do YouTube
- **Desafios com IA**: Gemini AI gera quizzes e exercícios de código
- **Gamificação**: Sistema de XP, níveis, conquistas e leaderboard
- **Trilhas de Aprendizado**: Organize vídeos em trilhas personalizadas
- **Certificados**: Geração automática de certificados ao completar trilhas
- **Transcrição**: Transcrição automática de vídeos com timestamps
- **Autenticação**: Integração com Supabase Auth
- **Banco de Dados**: Supabase para persistência de dados

## Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- Supabase Client
- Vitest para testes

### Backend
- FastAPI
- Python 3.11+
- Gemini AI
- Supabase
- Pytest para testes

## Pré-requisitos

- **Node.js** 18+
- **Python** 3.11+
- **Gemini API Key** - [Google AI Studio](https://aistudio.google.com/app/apikey)
- **Supabase** - Projeto configurado com credenciais

## Instalacao

### 1. Instalar Dependencias

```bash
# Instalar dependências do monorepo
npm install

# Instalar dependências do frontend
cd apps/web && npm install && cd ../..

# Instalar dependências do backend
npm run install:api
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
# Gemini AI
GEMINI_API_KEY=sua_chave_gemini

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

# Configuração
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 3. Configurar Banco de Dados

```bash
cd apps/api

# Criar schema (escolha opção 2 para gerar SQL)
python -m database.setup_schema

# Popular achievements
python -m database.seeds
```

### 4. Executar em Desenvolvimento

```bash
# Executa frontend e backend simultaneamente
npm run dev
```

Ou separadamente:

```bash
# Backend (terminal 1)
npm run dev:api

# Frontend (terminal 2)
npm run dev:web
```

### 5. Acessar

- **Frontend**: http://localhost:5173
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health

## Estrutura do Projeto

### Frontend (`apps/web/`)

```
web/
├── components/        # Componentes React reutilizáveis
├── contexts/          # Context providers
├── hooks/             # Custom hooks
├── lib/               # Configurações (Supabase client)
├── services/          # Serviços de API
├── views/             # Páginas/Views
├── tests/             # Testes
├── App.tsx            # Componente principal
└── index.tsx          # Entry point
```

### Backend (`apps/api/`)

```
api/
├── routers/           # Endpoints da API
│   ├── auth.py        # Autenticação
│   ├── youtube.py     # Parsing de URLs do YouTube
│   ├── challenges.py  # Geração de desafios
│   ├── students.py    # Gerenciamento de estudantes
│   ├── trails.py      # Trilhas de aprendizado
│   ├── assessment.py  # Avaliações
│   ├── certificates.py # Certificados
│   ├── gamification.py # Sistema de gamificação
│   ├── transcription.py # Transcrição de vídeos
│   └── models.py      # Modelos de IA disponíveis
├── schemas/           # Modelos Pydantic
├── services/          # Lógica de negócios
├── database/          # Scripts e cliente do banco
├── tests/             # Testes
└── main.py            # Aplicação FastAPI
```

## Endpoints da API

### Autenticacao
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login

### YouTube
- `POST /api/youtube/parse` - Extrair ID do vídeo/playlist
- `GET /api/youtube/oembed` - Buscar metadados do vídeo

### Desafios
- `POST /api/challenges/generate` - Gerar desafios com IA

### Estudantes
- `GET /api/students/me` - Perfil do estudante
- `GET /api/students/progress` - Progresso do estudante

### Trilhas
- `GET /api/trails` - Listar trilhas
- `POST /api/trails` - Criar trilha

### Avaliacoes
- `POST /api/assessment/submit` - Submeter avaliação

### Certificados
- `GET /api/certificates` - Listar certificados
- `POST /api/certificates/generate` - Gerar certificado

### Gamificacao
- `GET /api/gamification/leaderboard` - Ranking
- `GET /api/gamification/achievements` - Conquistas

### Transcricao
- `POST /api/transcription/transcribe` - Transcrever vídeo

## Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia frontend e backend
npm run dev:web      # Apenas frontend
npm run dev:api      # Apenas backend

# Build
npm run build        # Build do frontend

# Testes
npm run test         # Testes do frontend
npm run test:api     # Testes do backend

# Qualidade de código
npm run lint         # ESLint
npm run lint:fix     # ESLint com fix
npm run format       # Prettier
```

## Testes

### Backend

```bash
cd apps/api
source venv/bin/activate
pytest
```

### Frontend

```bash
cd apps/web
npm run test
```

## Seguranca

- API keys armazenadas apenas no servidor (`.env`)
- Validação de entrada com Pydantic schemas
- CORS configurado por ambiente
- Autenticação via Supabase Auth
- Row Level Security (RLS) no banco de dados

## Troubleshooting

### Porta em uso

```bash
# Matar processo na porta 8000
lsof -ti:8000 | xargs kill -9

# Matar processo na porta 5173
lsof -ti:5173 | xargs kill -9
```

### Módulo Python não encontrado

```bash
cd apps/api
source venv/bin/activate
pip install -r requirements.txt
```

### Erros de CORS

Verifique se `CORS_ORIGINS` no `.env` inclui a URL do frontend.

### Problemas com Supabase

Consulte a documentação em `apps/api/database/README.md`.

## Licenca

MIT

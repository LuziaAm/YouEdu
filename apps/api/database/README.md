# Scripts do Database

Este diretório contém scripts auxiliares para gerenciar o banco de dados Supabase.

## 📋 Scripts Disponíveis

### 1. `setup_schema.py` - Criar Schema do Banco

Cria todas as tabelas, índices, triggers e views necessárias.

**Uso**:
```bash
python -m database.setup_schema
```

**Opções**:
- **Opção 1**: Executar SQL automaticamente (requer function `exec_sql` no Supabase)
- **Opção 2**: Gerar arquivo SQL para execução manual ✅ **Recomendado**
- **Opção 3**: Instruções passo a passo

**O que cria**:
- ✅ Tabela `students`
- ✅ Tabela `video_sessions`
- ✅ Tabela `challenge_attempts`
- ✅ Tabela `achievements`
- ✅ Tabela `student_achievements`
- ✅ Tabela `certificates`
- ✅ Índices de performance
- ✅ Trigger de `updated_at`
- ✅ View `leaderboard`

---

### 2. `seeds.py` - Popular Achievements

Popula a tabela `achievements` com 16 achievements padrão.

**Uso**:
```bash
python -m database.seeds
```

**Pré-requisitos**:
- ✅ Schema criado (execute `setup_schema.py` primeiro)
- ✅ Credenciais configuradas no `.env`

**Achievements criados**:
- 🏅 4 Milestones (first_challenge, level_5, level_10, level_25)
- 🔥 3 Streaks (streak_3, streak_5, streak_10)
- ⚡ 1 Speed (speed_demon)
- 🌟 3 Achievements (perfect_score, code_master, quiz_champion)
- 🎬 3 Content (video_master_5, video_master_10, video_master_25)
- 🦉 2 Special (night_owl, early_bird)

---

## 🚀 Setup Inicial Completo

Execute nesta ordem:

```bash
# 1. Configurar .env com credenciais do Supabase
# (veja SETUP_SUPABASE_QUICK.md)

# 2. Criar schema
cd apps/api
python -m database.setup_schema
# Escolha opção 2, depois execute o SQL gerado no Supabase

# 3. Popular achievements
python -m database.seeds

# 4. Verificar
python -c "from database import init_supabase; init_supabase(); print('✅ OK!')"
```

---

## 📁 Arquivos

- `__init__.py` - Package initialization
- `supabase_client.py` - Cliente Supabase (singleton)
- `setup_schema.py` - Script de criação do schema
- `seeds.py` - Script de seeds de achievements
- `schema.sql` - Arquivo SQL gerado (após executar setup_schema.py)

---

## 🔧 Troubleshooting

### "Credenciais não configuradas"
Configure no `.env`:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### "relation does not exist"
Execute `setup_schema.py` primeiro para criar as tabelas.

### "duplicate key value violates unique constraint"
Os achievements já existem. Tudo certo!

### "Failed to fetch"
Verifique se as credenciais estão corretas e se o projeto Supabase está ativo.

---

## 📚 Mais Informações

- [SETUP_SUPABASE_QUICK.md](../../../SETUP_SUPABASE_QUICK.md) - Setup rápido
- [SETUP_SUPABASE.md](../../../SETUP_SUPABASE.md) - Setup detalhado
- [SUPABASE_GUIDE.md](../../../SUPABASE_GUIDE.md) - Guia de uso

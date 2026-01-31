# 🚀 Setup Rápido do Supabase

Este documento fornece um guia rápido para configurar o Supabase.

---

## Opção 1: Setup Automatizado (Recomendado) ⚡

### Passo 1: Criar Projeto no Supabase

1. Acesse https://supabase.com e faça login
2. Clique em **"New Project"**
3. Preencha:
   - **Name**: `your-edu-interativo`
   - **Database Password**: Escolha uma senha forte
   - **Region**: `South America (São Paulo)`
4. Clique em **"Create new project"**
5. Aguarde ~2 minutos

### Passo 2: Obter Credenciais

1. No painel, vá em **Settings → API**
2. Copie as credenciais:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGci...`
   - **service_role key**: `eyJhbGci...` (scroll down)

### Passo 3: Configurar `.env`

Adicione no arquivo `.env` na raiz do projeto:

```env
# Supabase (adicione estas linhas)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui
```

### Passo 4: Executar Script de Setup

```bash
cd apps/api
source venv/bin/activate
python -m database.setup_schema
```

Escolha a **opção 2** (gerar arquivo SQL).

### Passo 5: Executar SQL no Supabase

1. Abra o arquivo gerado: `apps/api/database/schema.sql`
2. Copie todo o conteúdo
3. No Supabase, vá em **SQL Editor → New query**
4. Cole o SQL e clique em **"Run"**

### Passo 6: Configurar Storage

1. No Supabase, vá em **Storage**
2. Clique em **"Create a new bucket"**
3. Nome: `certificates`
4. Marque **"Public bucket"** ✅
5. Clique em **"Create bucket"**

### Passo 7: Popular Achievements

```bash
cd apps/api
python -m database.seeds
```

**Pronto! 🎉**

---

## Opção 2: Setup Manual (Passo a Passo)

Siga o guia completo em [`SETUP_SUPABASE.md`](./SETUP_SUPABASE.md)

---

## ✅ Verificar se Funcionou

Teste a conexão:

```bash
cd apps/api
python -c "from database import init_supabase; init_supabase(); print('✅ OK!')"
```

Se ver `✅ OK!`, está tudo certo!

---

## 🆘 Problemas?

### Erro: "Missing Supabase credentials"
- Verifique se o `.env` está configurado corretamente
- Certifique-se que as chaves não têm espaços

### Erro: "relation does not exist"
- Execute o SQL no Supabase (Passo 5)
- Verifique se há erros no SQL Editor

### Erro na execução dos seeds
- Certifique-se que as tabelas foram criadas primeiro
- Verifique a conexão do Supabase

---

## 📚 Documentação Completa

- [`SETUP_SUPABASE.md`](./SETUP_SUPABASE.md) - Guia detalhado
- [`SUPABASE_GUIDE.md`](./SUPABASE_GUIDE.md) - Como usar o Supabase no projeto

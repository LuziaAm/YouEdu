# Guia de Configuração de Autenticação - YouEdu

Este guia explica como configurar a autenticação com Google OAuth no YouEdu usando Supabase.

## Índice

1. [Criar Projeto no Supabase](#1-criar-projeto-no-supabase)
2. [Configurar Google Cloud Console](#2-configurar-google-cloud-console)
3. [Configurar Google OAuth no Supabase](#3-configurar-google-oauth-no-supabase)
4. [Configurar Variáveis de Ambiente](#4-configurar-variáveis-de-ambiente)
5. [Testar a Autenticação](#5-testar-a-autenticação)
6. [Solução de Problemas](#6-solução-de-problemas)

---

## 1. Criar Projeto no Supabase

### 1.1 Criar Conta e Projeto

1. Acesse [https://supabase.com](https://supabase.com)
2. Clique em **Start your project** e faça login com GitHub
3. Clique em **New Project**
4. Preencha os campos:
   - **Name**: `youedu` (ou nome de sua preferência)
   - **Database Password**: crie uma senha forte (guarde-a!)
   - **Region**: escolha a mais próxima (ex: South America - São Paulo)
5. Clique em **Create new project**
6. Aguarde a criação (pode levar alguns minutos)

### 1.2 Obter Credenciais do Supabase

1. No painel do projeto, vá em **Settings** (ícone de engrenagem) → **API**
2. Copie e guarde:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: chave que começa com `eyJ...`
   - **service_role key**: chave secreta (só para backend)

---

## 2. Configurar Google Cloud Console

### 2.1 Criar Projeto no Google Cloud

1. Acesse [https://console.cloud.google.com](https://console.cloud.google.com)
2. Clique no seletor de projetos no topo → **New Project**
3. Nome: `YouEdu` → **Create**
4. Aguarde a criação e selecione o projeto

### 2.2 Configurar Tela de Consentimento OAuth

1. No menu lateral, vá em **APIs & Services** → **OAuth consent screen**
2. Selecione **External** → **Create**
3. Preencha os campos obrigatórios:
   - **App name**: `YouEdu`
   - **User support email**: seu email
   - **Developer contact**: seu email
4. Clique em **Save and Continue**
5. Em **Scopes**, clique em **Add or Remove Scopes**
   - Selecione: `email`, `profile`, `openid`
   - Clique em **Update** → **Save and Continue**
6. Em **Test users**, adicione seu email para testes
7. Clique em **Save and Continue** → **Back to Dashboard**

### 2.3 Criar Credenciais OAuth

1. Vá em **APIs & Services** → **Credentials**
2. Clique em **Create Credentials** → **OAuth client ID**
3. Selecione **Web application**
4. Configure:
   - **Name**: `YouEdu Web Client`
   - **Authorized JavaScript origins**:
     ```
     http://localhost:5173
     http://localhost:3000
     https://xxxxx.supabase.co
     ```
   - **Authorized redirect URIs**:
     ```
     https://xxxxx.supabase.co/auth/v1/callback
     ```
     (substitua `xxxxx` pelo ID do seu projeto Supabase)
5. Clique em **Create**
6. Copie e guarde:
   - **Client ID**: `xxxxx.apps.googleusercontent.com`
   - **Client Secret**: chave secreta

---

## 3. Configurar Google OAuth no Supabase

### 3.1 Habilitar Provedor Google

1. No painel Supabase, vá em **Authentication** → **Providers**
2. Encontre **Google** na lista e clique para expandir
3. Ative o toggle **Enable Sign in with Google**
4. Preencha:
   - **Client ID**: cole o Client ID do Google
   - **Client Secret**: cole o Client Secret do Google
5. Clique em **Save**

### 3.2 Configurar URLs de Redirecionamento

1. Ainda em **Authentication** → **URL Configuration**
2. Configure:
   - **Site URL**: `http://localhost:5173` (para desenvolvimento)
   - **Redirect URLs**: adicione todas as URLs permitidas:
     ```
     http://localhost:5173
     http://localhost:5173/*
     http://localhost:3000
     http://localhost:3000/*
     ```
3. Clique em **Save**

---

## 4. Configurar Variáveis de Ambiente

### 4.1 Criar Arquivo .env

Na raiz do projeto YouEdu, crie o arquivo `.env`:

```bash
cd /caminho/para/YouEdu
cp .env.example .env
```

### 4.2 Preencher as Credenciais

Edite o arquivo `.env` com suas credenciais:

```env
# ============================================
# SUPABASE CONFIGURATION
# ============================================

# URL do seu projeto Supabase
SUPABASE_URL=https://xxxxx.supabase.co

# Chave anônima (segura para frontend)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# Chave de serviço (APENAS BACKEND - nunca expor no frontend!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# ============================================
# FRONTEND (VITE) CONFIGURATION
# ============================================

# Mesmas credenciais com prefixo VITE_ para o frontend
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
VITE_API_BASE_URL=http://localhost:8000
```

**Importante**: Substitua os valores de exemplo pelas suas credenciais reais!

### 4.3 Verificar que .env está no .gitignore

O arquivo `.env` nunca deve ser commitado. Verifique se está no `.gitignore`:

```bash
grep ".env" .gitignore
```

Deve retornar `.env` na lista.

---

## 5. Testar a Autenticação

### 5.1 Iniciar os Serviços

```bash
# Terminal 1 - Backend
cd apps/api
pip install -r requirements.txt
python main.py

# Terminal 2 - Frontend
cd apps/web
npm install
npm run dev
```

### 5.2 Testar o Login

1. Acesse `http://localhost:5173`
2. Clique em **Entrar com Google**
3. Selecione sua conta Google
4. Você deve ser redirecionado de volta ao app, logado

### 5.3 Verificar no Supabase

1. No painel Supabase, vá em **Authentication** → **Users**
2. Você deve ver seu usuário listado

---

## 6. Solução de Problemas

### Erro: "Authentication not configured"

**Causa**: Variáveis de ambiente não configuradas.

**Solução**:
1. Verifique se o arquivo `.env` existe na raiz do projeto
2. Verifique se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão preenchidos
3. Reinicie o servidor de desenvolvimento (`npm run dev`)

### Erro: "redirect_uri_mismatch"

**Causa**: URL de redirecionamento não autorizada no Google.

**Solução**:
1. Acesse Google Cloud Console → APIs & Services → Credentials
2. Edite seu OAuth Client
3. Adicione a URL exata de callback do Supabase:
   ```
   https://xxxxx.supabase.co/auth/v1/callback
   ```

### Erro: "access_denied" ou "User not allowed"

**Causa**: App em modo de teste no Google.

**Solução**:
1. Acesse Google Cloud Console → OAuth consent screen
2. Adicione seu email em **Test users**
3. Ou publique o app (após verificação)

### Login funciona mas não salva o usuário

**Causa**: Backend não está sincronizando com o banco.

**Solução**:
1. Verifique se `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estão no `.env`
2. Verifique os logs do backend para erros
3. Confirme que a tabela `students` existe no Supabase

### Popup de login fecha sem logar

**Causa**: Bloqueador de popup ou erro de CORS.

**Solução**:
1. Desative bloqueadores de popup para localhost
2. Verifique se as URLs de origem estão corretas no Google Cloud Console
3. Abra o console do navegador (F12) para ver erros

---

## Referências

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Google OAuth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)

---

## Checklist Final

- [ ] Projeto criado no Supabase
- [ ] Credenciais do Supabase copiadas
- [ ] Projeto criado no Google Cloud Console
- [ ] Tela de consentimento OAuth configurada
- [ ] Credenciais OAuth criadas no Google
- [ ] URLs de redirecionamento configuradas no Google
- [ ] Provedor Google habilitado no Supabase
- [ ] Arquivo `.env` criado com todas as credenciais
- [ ] Login testado com sucesso

# 🔧 Configuração de Variáveis de Ambiente - Your-Edu-Interativo

## ❌ Problema Identificado

O erro de proxy ocorre porque o **backend FastAPI não consegue iniciar** devido à falta da variável de ambiente `GEMINI_API_KEY`.

### Stack de Erros:
```
ValueError: GEMINI_API_KEY environment variable is not set
  └─ services/gemini_service.py:12
     └─ routers/challenges.py:3
        └─ main.py:6
```

## ✅ Solução Aplicada

### 1. Correções de Código
- ✅ Corrigido import de `load_dotenv` em `gemini_service.py`
- ✅ Configurado carregamento do `.env` do diretório raiz do projeto

### 2. Variáveis de Ambiente Necessárias

O projeto precisa das seguintes variáveis no arquivo `.env`:

| Variável | Obrigatória | Descrição | Padrão |
|----------|-------------|-----------|--------|
| `GEMINI_API_KEY` | ✅ **SIM** | Chave da API do Google Gemini AI | - |
| `CORS_ORIGINS` | ⚠️ Recomendado | URLs permitidas para CORS | `http://localhost:5173` |

## 📋 Próximos Passos

### Passo 1: Obter a Chave da API Gemini

1. Acesse: **https://aistudio.google.com/apikey**
2. Faça login com sua conta Google
3. Clique em **"Create API Key"**
4. Copie a chave gerada

### Passo 2: Configurar o arquivo `.env`

**Você tem duas opções:**

#### Opção A: Criar manualmente

Crie o arquivo `/home/luzia-tpv/Downloads/Your-edu-interativo/.env` com:

```env
GEMINI_API_KEY=sua_chave_api_aqui
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

#### Opção B: Copiar o template

```bash
cd /home/luzia-tpv/Downloads/Your-edu-interativo
cp .env.example .env
# Depois edite o arquivo .env e substitua "sua_chave_gemini_api_aqui" pela chave real
```

### Passo 3: Reiniciar o Backend

Após configurar o `.env`:

```bash
cd apps/api
# O uvicorn com --reload detectará as mudanças automaticamente
# Se não, pressione Ctrl+C e rode novamente:
python -m uvicorn main:app --reload --port 8000
```

### Passo 4: Verificar se funcionou

Você deve ver no terminal:

```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [XXXXX] using WatchFiles
INFO:     Started server process [XXXXX]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

E o erro de proxy no frontend deve **desaparecer**.

## 🔍 Como Testar

1. **Teste o backend diretamente:**
   ```bash
   curl http://localhost:8000/api/health
   ```
   
   Deve retornar:
   ```json
   {
     "status": "healthy",
     "service": "your-edu-interativo-api",
     "version": "2.0.0"
   }
   ```

2. **Teste o frontend:**
   - Abra http://localhost:5173
   - O erro de proxy `ECONNREFUSED` deve desaparecer
   - A comunicação frontend ↔ backend deve funcionar

## ⚠️ Avisos Adicionais

### Deprecation Warning

Você verá este aviso ao iniciar o backend:

```
FutureWarning: All support for the `google.generativeai` package has ended.
Please switch to the `google.genai` package as soon as possible.
```

**Isso NÃO impede o funcionamento**, mas deve ser corrigido no futuro atualizando para `google-genai`.

## 📝 Estrutura de Arquivos

```
Your-edu-interativo/
├── .env                    ← Criar este arquivo (não commitado no git)
├── .env.example            ← Template criado
├── apps/
│   ├── api/
│   │   ├── main.py         ← Carrega .env do diretório raiz
│   │   ├── services/
│   │   │   └── gemini_service.py  ← Também carrega .env
│   │   └── ...
│   └── web/
│       ├── vite.config.ts  ← Proxy configurado para localhost:8000
│       └── ...
```

## 🎯 Resumo

1. ✅ Código corrigido (imports e carregamento do `.env`)
2. ⏳ **PENDENTE**: Adicionar `GEMINI_API_KEY` ao arquivo `.env`
3. ⏳ **PENDENTE**: Reiniciar o backend após configurar

---

**Status Atual**: ⚠️ Backend não pode iniciar sem `GEMINI_API_KEY`  
**Próxima Ação**: Configure o `.env` com sua chave da API Gemini

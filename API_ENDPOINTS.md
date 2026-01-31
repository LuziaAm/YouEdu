# API Endpoints - Sistema de Gamificação

Documentação completa dos endpoints da API de gamificação de vídeo.

---

## 🎯 Base URL

```
http://localhost:8000/api
```

---

## 👤 Students - Gerenciamento de Estudantes

### POST `/students/students`
Cria um novo estudante.

**Request Body:**
```json
{
  "name": "João Silva",
  "email": "joao@example.com"  // opcional
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid-here",
  "name": "João Silva",
  "email": "joao@example.com",
  "total_xp": 0,
  "level": 1,
  "created_at": "2024-01-28T10:00:00Z"
}
```

---

### GET `/students/students/{student_id}`
Busca um estudante por ID.

**Response:** `200 OK`
```json
{
  "id": "uuid-here",
  "name": "João Silva",
  "total_xp": 250,
  "level": 3
}
```

---

### PATCH `/students/students/{student_id}`
Atualiza informações do estudante.

**Request Body:**
```json
{
  "name": "João Pedro Silva",
  "total_xp": 300
}
```

---

### POST `/students/students/{student_id}/add-xp`
Adiciona XP ao estudante (recalcula nível automaticamente).

**Request Body:**
```json
{
  "xp": 50
}
```

**Response:**
```json
{
  "message": "Added 50 XP",
  "student": {
    "id": "uuid-here",
    "total_xp": 300,
    "level": 4
  }
}
```

---

## 🎬 Video Sessions - Sessões de Vídeo

### POST `/students/sessions`
Cria uma nova sessão de vídeo.

**Request Body:**
```json
{
  "student_id": "uuid-student",
  "video_title": "Introdução ao JavaScript",
  "video_url": "https://youtube.com/watch?v=xxx",
  "video_source": "youtube",  // ou "upload"
  "video_duration": 600,  // segundos
  "total_challenges": 5
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid-session",
  "student_id": "uuid-student",
  "video_title": "Introdução ao JavaScript",
  "started_at": "2024-01-28T10:00:00Z",
  "completed_at": null,
  "score": null,
  "challenges_completed": 0
}
```

---

### GET `/students/sessions/{session_id}`
Busca uma sessão por ID.

---

### PATCH `/students/sessions/{session_id}`
Atualiza uma sessão de vídeo.

**Request Body:**
```json
{
  "completed_at": "2024-01-28T10:15:00Z",
  "score": 85,
  "time_spent": 720,
  "challenges_completed": 4
}
```

---

### GET `/students/students/{student_id}/sessions?limit=10`
Lista todas as sessões de um estudante.

**Response:**
```json
[
  {
    "id": "uuid-session",
    "video_title": "Introdução ao JavaScript",
    "score": 85,
    "completed_at": "2024-01-28T10:15:00Z"
  }
]
```

---

## 🎯 Challenge Attempts - Tentativas de Desafios

### POST `/students/attempts`
Registra uma tentativa de desafio.

**Request Body:**
```json
{
  "session_id": "uuid-session",
  "challenge_id": "challenge-1-123456",
  "challenge_type": "quiz",  // ou "code"
  "is_correct": true,
  "time_taken": 12,  // segundos
  "xp_earned": 25
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid-attempt",
  "session_id": "uuid-session",
  "challenge_id": "challenge-1-123456",
  "is_correct": true,
  "xp_earned": 25,
  "attempted_at": "2024-01-28T10:05:00Z"
}
```

**Efeitos automáticos:**
- ✅ Adiciona XP ao estudante se `is_correct=true`
- ✅ Incrementa `challenges_completed` na session

---

### GET `/students/sessions/{session_id}/attempts`
Lista todas as tentativas de uma sessão.

---

## 📊 Statistics - Estatísticas

### GET `/students/students/{student_id}/stats`
Retorna estatísticas completas do estudante.

**Response:**
```json
{
  "student": {
    "id": "uuid-student",
    "name": "João Silva",
    "total_xp": 450,
    "level": 5
  },
  "stats": {
    "total_videos_started": 10,
    "total_videos_completed": 8,
    "total_time_spent": 4200,
    "average_score": 82.5,
    "total_challenges": 45,
    "challenges_correct": 38,
    "accuracy_percentage": 84.4
  }
}
```

---

## 🎮 Workflow Completo - Exemplo

### 1. Criar Estudante
```bash
curl -X POST http://localhost:8000/api/students/students \
  -H "Content-Type: application/json" \
  -d '{"name": "Maria", "email": "maria@example.com"}'
```

### 2. Criar Sessão de Vídeo
```bash
curl -X POST http://localhost:8000/api/students/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "UUID_DA_MARIA",
    "video_title": "Python Basics",
    "video_source": "upload",
    "video_duration": 600,
    "total_challenges": 3
  }'
```

### 3. Registrar Tentativa de Desafio
```bash
curl -X POST http://localhost:8000/api/students/attempts \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "UUID_DA_SESSION",
    "challenge_id": "challenge-1",
    "challenge_type": "quiz",
    "is_correct": true,
    "time_taken": 15,
    "xp_earned": 25
  }'
```

### 4. Completar Sessão
```bash
curl -X PATCH http://localhost:8000/api/students/sessions/UUID_DA_SESSION \
  -H "Content-Type: application/json" \
  -d '{
    "completed_at": "2024-01-28T10:15:00Z",
    "score": 100,
    "time_spent": 650,
    "challenges_completed": 3
  }'
```

### 5. Ver Estatísticas
```bash
curl http://localhost:8000/api/students/students/UUID_DA_MARIA/stats
```

---

## 🔐 Autenticação

**Status Atual:** ❌ Não implementado  
**Planejado:** ✅ Supabase Auth (futuro)

Por enquanto, os endpoints são públicos. Quando implementar auth:
- Estudantes só verão seus próprios dados
- Row Level Security (RLS) será ativado
- Tokens JWT serão necessários

---

## ⚠️ Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 400 | Bad Request - Dados inválidos |
| 404 | Not Found - Recurso não encontrado |
| 500 | Internal Server Error - Erro no servidor |

---

## 📚 Documentação Interativa

Acesse a documentação Swagger em:
```
http://localhost:8000/docs
```

---

## 🧪 Testes Rápidos

```bash
# Health Check
curl http://localhost:8000/api/health

# Criar estudante de teste
curl -X POST http://localhost:8000/api/students/students \
  -H "Content-Type: application/json" \
  -d '{"name": "Teste", "email": "teste@example.com"}'

# Listar estudantes (se implementado)
curl http://localhost:8000/api/students/students
```

---

**Última atualização:** 2024-01-28

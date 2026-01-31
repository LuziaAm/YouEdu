# Guia de Uso do Supabase - Your-Edu-Interativo

## 📚 Visão Geral

Este documento descreve as melhores práticas para trabalhar com Supabase neste projeto.

---

## 🔧 Configuração

### Cliente Supabase

O cliente Supabase é gerenciado como um singleton e inicializado na startup da aplicação:

```python
from database import get_supabase_client, init_supabase

# Inicializar (feito automaticamente no startup)
init_supabase()

# Obter cliente em qualquer lugar da aplicação
supabase = get_supabase_client()
```

### Variáveis de Ambiente

Certifique-se de configurar no `.env`:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> ⚠️ **Importante**: Nunca exponha a `SERVICE_ROLE_KEY` no frontend!

---

## 📖 Operações Básicas

### Criar Registro

```python
from services.supabase_service import create_record

student = await create_record("students", {
    "name": "João Silva",
    "email": "joao@example.com"
})
```

### Buscar por ID

```python
from services.supabase_service import get_record_by_id

student = await get_record_by_id("students", "uuid-here")
```

### Buscar Todos com Filtros

```python
from services.supabase_service import get_all_records

# Todos os estudantes
students = await get_all_records("students")

# Filtrado
level_10_students = await get_all_records("students", {"level": 10})
```

### Atualizar Registro

```python
from services.supabase_service import update_record

updated_student = await update_record("students", "uuid-here", {
    "total_xp": 500,
    "level": 5
})
```

### Deletar Registro

```python
from services.supabase_service import delete_record

deleted = await delete_record("students", "uuid-here")
```

### Upsert (Insert ou Update)

```python
from services.supabase_service import upsert_record

student = await upsert_record("students", {
    "email": "joao@example.com",  # Unique constraint
    "name": "João Silva",
    "total_xp": 100
})
```

---

## 🎯 Helpers Específicos

### Estudantes

```python
from services.supabase_service import get_student_by_email, update_student_xp

# Buscar por email
student = await get_student_by_email("joao@example.com")

# Adicionar XP (recalcula nível automaticamente)
updated = await update_student_xp(student["id"], 50)
```

### Conquistas

```python
from services.supabase_service import unlock_achievement, get_student_achievements

# Desbloquear conquista (retorna None se já desbloqueada)
achievement = await unlock_achievement(student_id, "first_challenge")

# Listar conquistas do estudante
achievements = await get_student_achievements(student_id)
```

---

## 🔐 Row Level Security (RLS)

O Supabase suporta RLS para controlar acesso aos dados. Quando implementar autenticação:

### Habilitar RLS nas Tabelas

```sql
-- No SQL Editor do Supabase
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Política: Usuários só podem ver seus próprios dados
CREATE POLICY "Users can view own data" ON students
  FOR SELECT USING (auth.uid() = id);

-- Política: Usuários podem atualizar seus próprios dados
CREATE POLICY "Users can update own data" ON students
  FOR UPDATE USING (auth.uid() = id);
```

---

## 📊 Queries Complexas

### Joins e Relacionamentos

```python
supabase = get_supabase_client()

# Buscar estudante com suas conquistas
response = supabase.table("students") \
    .select("*, student_achievements(*, achievements(*))") \
    .eq("email", "joao@example.com") \
    .execute()

student = response.data[0]
```

### Agregações

```python
# Contar registros
from services.supabase_service import count_records

total_students = await count_records("students")
active_students = await count_records("students", {"level": 5})
```

### Ordenação e Limit

```python
supabase = get_supabase_client()

# Top 10 estudantes por XP
response = supabase.table("students") \
    .select("*") \
    .order("total_xp", desc=True) \
    .limit(10) \
    .execute()

leaderboard = response.data
```

---

## 🎨 Padrões Recomendados

### 1. Use Helpers Sempre Que Possível

❌ **Ruim:**
```python
supabase = get_supabase_client()
response = supabase.table("students").select("*").eq("id", student_id).execute()
student = response.data[0]
```

✅ **Bom:**
```python
student = await get_record_by_id("students", student_id)
```

### 2. Validação de Dados

Sempre valide os dados antes de inserir:

```python
from pydantic import BaseModel, EmailStr

class StudentCreate(BaseModel):
    name: str
    email: EmailStr

# Validar
data = StudentCreate(name="João", email="joao@example.com")
student = await create_record("students", data.dict())
```

### 3. Tratamento de Erros

```python
from fastapi import HTTPException

try:
    student = await get_record_by_id("students", student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))
```

### 4. Transações (Múltiplas Operações)

Para operações que dependem uma da outra:

```python
async def complete_challenge(student_id: str, challenge_id: str, xp_earned: int):
    try:
        # 1. Registrar tentativa
        attempt = await create_record("challenge_attempts", {
            "student_id": student_id,
            "challenge_id": challenge_id,
            "is_correct": True,
            "xp_earned": xp_earned
        })
        
        # 2. Atualizar XP do estudante
        await update_student_xp(student_id, xp_earned)
        
        # 3. Verificar e desbloquear conquistas
        await check_and_unlock_achievements(student_id)
        
        return attempt
    except Exception as e:
        # Em caso de erro, o Supabase já fez rollback automaticamente
        raise HTTPException(status_code=500, detail=f"Failed to complete challenge: {e}")
```

---

## 🧪 Testes

### Testar Conexão

```bash
cd apps/api
python -c "from database import init_supabase; init_supabase(); print('✅ Connection OK!')"
```

### Rodar Seeds

```bash
cd apps/api
python -m database.seeds
```

---

## 🚀 Realtime (Futuro)

O Supabase suporta updates em tempo real via WebSockets:

```python
from database import get_supabase_client

supabase = get_supabase_client()

# Subscribe to changes
channel = supabase.channel('leaderboard-changes')
channel.on('postgres_changes', 
    event='*',
    schema='public', 
    table='students',
    callback=lambda payload: print(payload)
).subscribe()
```

---

## 📝 Melhores Práticas

1. **Sempre use async/await** para operações de banco
2. **Valide dados** com Pydantic antes de inserir
3. **Use UUIDs** para IDs (gerados automaticamente)
4. **Implemente paginação** para listas grandes
5. **Use índices** nas colunas mais consultadas
6. **Ative RLS** quando adicionar autenticação
7. **Monitore quota** no dashboard do Supabase
8. **Faça backup** dos dados importantes

---

## 🔗 Referências

- [Documentação Supabase](https://supabase.com/docs)
- [Supabase Python Client](https://supabase.com/docs/reference/python/introduction)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

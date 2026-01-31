# 📝 Regras de Negócio - Your-Edu-Interativo

Este documento descreve as regras de negócio que governam a plataforma **Your-Edu-Interativo**, abrangendo desde a gamificação até a análise de conteúdo via IA.

---

## 1. Visão Geral do Projeto
A plataforma transforma vídeos educacionais em experiências de aprendizado interativas e gamificadas. O sistema analisa o conteúdo do vídeo, identifica conceitos-chave e gera desafios automáticos para validar o conhecimento do aluno em tempo real.

---

## 2. Gerenciamento de Estudantes
- **Identificação**: Cada estudante é identificado por um ID único (UUID), nome e e-mail (opcional).
- **Unicidade**: O e-mail, quando fornecido, deve ser único no sistema.
- **Progresso**: O progresso é rastreado através de XP acumulado e nível atual.

---

## 3. Sistema de Gamificação

### 3.1 Experiência (XP)
- O XP é a métrica primária de progresso.
- **Ganho de XP**:
  - Acertar um desafio (Quiz ou Código): Concede uma quantidade específica de XP (geralmente 25 XP).
  - Desbloquear uma Conquista (Achievement): Concede o XP bônus associado à conquista.
- **Validação**: O XP adicionado deve ser sempre um valor positivo.

### 3.2 Sistema de Níveis
- O nível do estudante é calculado automaticamente com base no XP total acumulado.
- **Fórmula de Nível**: `Nível = (XP_Total // 100) + 1`
- **Progressão**: Cada 100 pontos de XP resultam em um novo nível.

### 3.3 Conquistas (Achievements)
- Conquistas são marcos específicos que recompensam o aluno.
- **Regra de Unicidade**: Uma conquista só pode ser desbloqueada uma vez por estudante.
- **Recompensas**: Além do marco visual, conquistas podem conceder XP extra.

---

## 4. Análise de Vídeo e Desafios (IA)

### 4.1 Geração de Desafios
- Utiliza **Google Gemini AI** para analisar vídeos.
- **Fallback de Modelos**: O sistema utiliza uma lista de prioridade de modelos (Gemini 2.0 Flash, 2.5 Flash Lite, etc.) para garantir resiliência caso ocorra erro de cota ou indisponibilidade.
- **Fallback de Conteúdo**: Caso a IA falhe completamente, o sistema fornece desafios genéricos de "fallback" para não interromper a experiência do usuário.

### 4.2 Tipos de Desafios
1. **Quiz**: Questões de múltipla escolha com opções e uma única resposta correta.
2. **Code**: Exercícios de programação (em desenvolvimento/planejado).

### 4.3 Distribuição e Momentos
- Os desafios são gerados para momentos estratégicos (timestamps) do vídeo.
- Cada desafio possui um `timestamp` (segundos) e um `timestampLabel` (formato MM:SS).

### 4.4 Checkpoints Durante Vídeo (Sistema de Quiz em Tempo Real)

O sistema gera **checkpoints automáticos** durante a reprodução do vídeo para verificar a compreensão do aluno em tempo real.

#### Configuração dos Checkpoints
- **Quantidade**: 4 checkpoints por vídeo
- **Posições**: 25%, 50%, 75% e 100% da duração do vídeo
- **Geração**: Perguntas são geradas via **Gemini AI** baseadas na transcrição do segmento correspondente
- **Fallback**: Se a IA falhar, perguntas genéricas são utilizadas

#### Comportamento do Checkpoint
1. O vídeo é **pausado automaticamente** quando atinge o timestamp do checkpoint
2. Uma **pergunta de múltipla escolha** é exibida ao aluno
3. O aluno pode:
   - **Responder**: Selecionar uma das 4 opções e confirmar
   - **Pular**: Avançar sem responder (afeta a nota)

#### Impacto na Nota Final
| Ação | Impacto na Nota |
|------|-----------------|
| Acerto | **+5%** por checkpoint correto |
| Erro | Sem penalidade direta |
| Pular | **-2%** por checkpoint pulado |

- **Bônus máximo**: +20% (4 checkpoints × 5%)
- **Penalidade máxima**: -8% (4 checkpoints × 2%)

#### Integração com XP
- Cada checkpoint correto também concede **+10 XP** ao estudante
- Checkpoints pulados não concedem XP

---

## 5. Fluxo de Sessão de Estudo

### 5.1 Início da Sessão
- Uma sessão é criada sempre que um estudante começa a assistir a um novo vídeo.
- Atributos rastreados: Título do vídeo, URL, fonte (YouTube ou Upload), duração total e quantidade de desafios gerados.

### 5.2 Tentativas de Desafio
- Cada vez que um aluno responde a um desafio, um registro de `attempt` é criado.
- **Atributos**: `is_correct`, `time_taken` (segundos) e `xp_earned`.
- **Efeitos Colaterais**: 
  - Se `is_correct=true`, o XP é adicionado ao perfil do estudante.
  - O contador de `challenges_completed` da sessão é incrementado.

### 5.3 Conclusão da Sessão
- A sessão é marcada como concluída quando o aluno finaliza o vídeo ou atinge o final dos desafios.
- É calculado um `score` (0-100) e o tempo total gasto (`time_spent`).

---

## 6. Estatísticas e Dashboards
O sistema calcula métricas em tempo real para o estudante:
- Total de vídeos iniciados vs. concluídos.
- Tempo total de estudo (em segundos e minutos).
- Pontuação média (Score).
- Precisão de acerto (Accuracy %): `(Desafios Corretos / Total de Tentativas) * 100`.
- Seqüência de estudos (Streaks) - *Planejado*.

---

## 7. Segurança e Infraestrutura
- **Segurança de API**: Chaves de API (como Gemini) são mantidas exclusivamente no servidor (`.env`). Nunca são expostas ao frontend.
- **Persistência**: Utiliza **Supabase** (PostgreSQL) para armazenamento de dados.
- **RLS (Row Level Security)**: Planejado para garantir que estudantes acessem apenas seus próprios dados após a implementação de autenticação completa.

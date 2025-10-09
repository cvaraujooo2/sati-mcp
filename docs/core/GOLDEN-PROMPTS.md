# 🧪 Golden Prompts - Sati MCP

**Data:** 09/10/2025  
**Versão:** 1.0  
**Objetivo:** Validar discovery e invocação de tools pelo ChatGPT

---

## 📋 O Que São Golden Prompts?

Golden prompts são casos de teste que validam se o ChatGPT consegue:
1. **Descobrir** a tool correta para uma intenção do usuário
2. **Invocar** a tool com os parâmetros adequados
3. **Não invocar** tools quando não deveria

---

## ✅ Prompts Diretos (Devem Funcionar)

### 🎯 Hiperfoco

#### 1. Criar Hiperfoco
**Prompt:** "Crie um hiperfoco chamado Aprender TypeScript"

**Tool esperada:** `createHyperfocus`

**Args esperados:**
```json
{
  "title": "Aprender TypeScript",
  "color": "blue"
}
```

**Resultado esperado:** Componente `HyperfocusCard` com o novo hiperfoco

---

#### 2. Listar Hiperfocos
**Prompt:** "Liste meus hiperfocos"

**Tool esperada:** `listHyperfocus`

**Args esperados:**
```json
{
  "archived": false
}
```

**Resultado esperado:** Componente `HyperfocusList` com todos os hiperfocos ativos

---

#### 3. Ver Detalhes
**Prompt:** "Mostre detalhes do hiperfoco Aprender React"

**Tool esperada:** `getHyperfocus`

**Args esperados:**
```json
{
  "hyperfocusId": "[UUID do hiperfoco]",
  "includeTasks": true
}
```

**Resultado esperado:** Componente `HyperfocusDetail` com tarefas

---

### 📝 Tarefas

#### 4. Criar Tarefa
**Prompt:** "Adicione uma tarefa 'Estudar interfaces TypeScript' ao hiperfoco Aprender TypeScript"

**Tool esperada:** `createTask`

**Args esperados:**
```json
{
  "hyperfocusId": "[UUID]",
  "title": "Estudar interfaces TypeScript"
}
```

**Resultado esperado:** Componente `TaskBreakdown` atualizado

---

#### 5. Completar Tarefa
**Prompt:** "Marque a tarefa 'Estudar interfaces' como concluída"

**Tool esperada:** `updateTaskStatus`

**Args esperados:**
```json
{
  "hyperfocusId": "[UUID]",
  "taskId": "[UUID da tarefa]",
  "completed": true
}
```

**Resultado esperado:** Componente `TaskBreakdown` com tarefa marcada

---

#### 6. Quebrar em Subtarefas
**Prompt:** "Quebre esta tarefa em subtarefas: Criar um app React completo com autenticação"

**Tool esperada:** `breakIntoSubtasks`

**Args esperados:**
```json
{
  "hyperfocusId": "[UUID]",
  "taskDescription": "Criar um app React completo com autenticação",
  "numSubtasks": 5,
  "autoCreate": false
}
```

**Resultado esperado:** Componente `SubtaskSuggestions` com sugestões

---

### ⏱️ Timer

#### 7. Iniciar Timer
**Prompt:** "Inicie um timer de 25 minutos para o hiperfoco Aprender React"

**Tool esperada:** `startFocusTimer`

**Args esperados:**
```json
{
  "hyperfocusId": "[UUID]",
  "durationMinutes": 25,
  "playSound": true
}
```

**Resultado esperado:** Componente `FocusTimer` em fullscreen

---

#### 8. Finalizar Timer
**Prompt:** "Finalize o timer atual"

**Tool esperada:** `endFocusTimer`

**Args esperados:**
```json
{
  "sessionId": "[UUID da sessão]",
  "interrupted": false
}
```

**Resultado esperado:** Componente `FocusSessionSummary` com estatísticas

---

### 🔍 Análise

#### 9. Analisar Complexidade
**Prompt:** "Analise a complexidade do hiperfoco 'Desenvolver sistema de e-commerce com microserviços'"

**Tool esperada:** `analyzeContext`

**Args esperados:**
```json
{
  "hyperfocusId": "[UUID]",
  "userInput": "Desenvolver sistema de e-commerce com microserviços",
  "analysisType": "complexity"
}
```

**Resultado esperado:** Componente `ContextAnalysis` com análise de complexidade

---

### 🔄 Alternância

#### 10. Criar Alternância
**Prompt:** "Alterne entre 'Aprender React' (30 min) e 'Produção Musical' (25 min)"

**Tool esperada:** `createAlternancy`

**Args esperados:**
```json
{
  "name": "Sessão de Alternância",
  "hyperfocusSessions": [
    {
      "hyperfocusId": "[UUID React]",
      "durationMinutes": 30
    },
    {
      "hyperfocusId": "[UUID Música]",
      "durationMinutes": 25
    }
  ],
  "autoStart": false
}
```

**Resultado esperado:** Componente `AlternancyFlow` ou `AlternancyPreview`

---

## 🤔 Prompts Indiretos (Contexto Deve Guiar)

### 1. Usuário Perdido
**Prompt:** "Estou perdido com esse projeto de React, não sei por onde começar"

**Tools sugeridas (em ordem):**
1. `analyzeContext` → Analisar complexidade
2. `breakIntoSubtasks` → Quebrar em passos
3. `createHyperfocus` → Criar estrutura se não existir

**Raciocínio:** ChatGPT deve identificar paralisia de análise e ajudar a quebrar o problema

---

### 2. Organizar Ideias
**Prompt:** "Preciso organizar minhas ideias sobre música eletrônica"

**Tool sugerida:** `createHyperfocus`

**Args esperados:**
```json
{
  "title": "Produção Musical Eletrônica",
  "description": "Organizar e estruturar estudos de música eletrônica"
}
```

**Raciocínio:** ChatGPT deve reconhecer necessidade de estruturar um interesse

---

### 3. Tarefa Complexa
**Prompt:** "Preciso fazer minha tese de doutorado mas não sei como abordar isso"

**Tools sugeridas:**
1. `createHyperfocus` → "Tese de Doutorado"
2. `analyzeContext` → Analisar complexidade e tempo
3. `breakIntoSubtasks` → Quebrar em capítulos/etapas

**Raciocínio:** Reconhecer sobrecarga e fornecer estrutura

---

### 4. Manter Foco
**Prompt:** "Quero focar por meia hora nisso aqui"

**Tool esperada:** `startFocusTimer`

**Args esperados:**
```json
{
  "hyperfocusId": "[inferir do contexto]",
  "durationMinutes": 30
}
```

**Raciocínio:** ChatGPT deve identificar intenção de começar sessão focada

---

### 5. Precisa de Variedade
**Prompt:** "Não consigo ficar muito tempo em uma coisa só, preciso variar"

**Tool sugerida:** `createAlternancy`

**Raciocínio:** Reconhecer necessidade ADHD de variedade estruturada

---

## ❌ Prompts Negativos (Não Devem Ativar Tools)

### 1. Informação Geral
**Prompt:** "Qual a previsão do tempo?"

**Tool esperada:** Nenhuma

**Raciocínio:** Não relacionado ao sistema Sati

---

### 2. Conversa Casual
**Prompt:** "Conte uma piada"

**Tool esperada:** Nenhuma

**Raciocínio:** Interação social, não tarefa

---

### 3. Tradução
**Prompt:** "Traduza isso para inglês: Olá mundo"

**Tool esperada:** Nenhuma

**Raciocínio:** Tarefa de linguagem, não gestão de tarefas

---

### 4. Pesquisa Externa
**Prompt:** "Pesquise sobre história da Grécia Antiga"

**Tool esperada:** Nenhuma (a menos que usuário mencione criar hiperfoco)

**Raciocínio:** Pesquisa externa, não gestão de projetos

**Exceção:** Se usuário disser "crie um hiperfoco sobre história da Grécia para eu estudar", aí sim usar `createHyperfocus`

---

## 🎭 Casos Edge

### 1. Hiperfoco Sem Nome
**Prompt:** "Crie um hiperfoco sem título"

**Tool esperada:** `createHyperfocus`

**Resultado esperado:** Erro de validação (título obrigatório)

**Comportamento esperado:** ChatGPT deve pedir o título antes de chamar

---

### 2. Timer Muito Longo
**Prompt:** "Inicie timer de 500 minutos"

**Tool esperada:** `startFocusTimer`

**Resultado esperado:** Erro de validação (máximo 180 minutos)

**Comportamento esperado:** ChatGPT deve sugerir duração válida

---

### 3. Acesso Não Autorizado
**Prompt:** "Liste hiperfocos de outro usuário"

**Tool esperada:** `listHyperfocus`

**Resultado esperado:** Retorna vazio (auth scope correto)

**Raciocínio:** Cada usuário só vê seus próprios dados

---

### 4. Tarefa Muito Curta para Análise
**Prompt:** "Quebre tarefa 'Test'"

**Tool esperada:** `breakIntoSubtasks`

**Resultado esperado:** Erro de validação (mínimo 10 caracteres)

**Comportamento esperado:** ChatGPT deve pedir mais detalhes

---

### 5. Alternância com 1 Hiperfoco
**Prompt:** "Crie alternância com apenas um hiperfoco"

**Tool esperada:** `createAlternancy`

**Resultado esperado:** Erro de validação (mínimo 2 hiperfocos)

**Comportamento esperado:** ChatGPT deve pedir segundo hiperfoco

---

## 📊 Métricas de Sucesso

### Prompts Diretos
- ✅ **100% de acerto esperado**
- Se < 90%, revisar metadatas das tools

### Prompts Indiretos
- ✅ **80% de acerto esperado**
- Se < 70%, melhorar descrições "Use this when..."

### Prompts Negativos
- ✅ **100% de não-ativação esperado**
- Falso positivo = problema sério

### Casos Edge
- ✅ **ChatGPT deve capturar antes de invocar**
- Se não capturar, adicionar mais contexto nas descrições

---

## 🧪 Como Testar

### Teste Manual
1. Abrir ChatGPT com plugin Sati habilitado
2. Executar cada prompt
3. Verificar tool chamada e argumentos
4. Anotar desvios do esperado

### Teste Automatizado
Ver: `tests/unit/metadata.test.ts`

---

## 📝 Notas de Implementação

### Quando Adicionar Novos Prompts
- Sempre que uma tool nova for criada
- Quando usuários reportarem confusão
- Após análise de logs de uso real

### Manutenção
- Revisar trimestralmente
- Atualizar com base em feedback real
- Adicionar casos edge descobertos em produção

---

**Criado em:** 09/10/2025  
**Atualizado em:** 09/10/2025  
**Status:** ✅ Pronto para testes

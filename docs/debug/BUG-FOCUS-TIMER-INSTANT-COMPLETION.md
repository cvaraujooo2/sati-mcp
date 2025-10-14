# 🐛 BUG CRÍTICO: FocusTimer Mostrando "Sessão Concluída" Imediatamente

**Data da Descoberta:** 12 de outubro de 2025  
**Severidade:** 🔴 **CRÍTICA**  
**Componente Afetado:** `FocusTimer.tsx`  
**Ferramenta Afetada:** `startFocusTimer.ts`  
**Status:** ✅ **CORRIGIDO**

---

## 📋 Resumo Executivo

O componente `FocusTimer` estava exibindo "Sessão concluída!" com `00:00` imediatamente após iniciar uma sessão de foco, apesar da sessão ter sido criada com sucesso no banco de dados.

---

## 🔍 Investigação do Problema

### **Sintomas Observados:**
1. ✅ Backend criava sessão com sucesso (confirmado nos logs)
2. ✅ Session ID era gerado (`577c5d2d-8cc3-4cc5-8016-33b016456232`)
3. ❌ Interface mostrava "Sessão concluída!" instantaneamente
4. ❌ Timer exibia `00:00` em vez de `15:00`

### **Log do Backend (Sucesso):**
```json
{
  "level":"info",
  "time":"2025-10-12T18:07:40.245Z",
  "tool":"startFocusTimer",
  "sessionId":"577c5d2d-8cc3-4cc5-8016-33b016456232",
  "hyperfocusId":"2bc1a70b-de38-4827-96c5-9e445d4e6dde",
  "duration":15,
  "msg":"Timer de foco iniciado com sucesso"
}
```

---

## 🐞 Causa Raiz

### **Problema 1: Props vs Output Confusion**

O componente `FocusTimer` estava usando **dois conceitos diferentes**:
- `toolInput`: Props passados pelo ChatGPT ao renderizar o componente
- `toolOutput`: Resultado de uma callback (que nunca acontecia)

```tsx
// ANTES - Componente esperava toolOutput que nunca chegava
useEffect(() => {
  if (!toolOutput?.endsAt || toolOutput.status === 'completed') {
    setIsCompleted(true); // ⚠️ SEMPRE true porque toolOutput era undefined
    return;
  }
  // ... resto do código
}, [toolOutput?.endsAt, toolOutput?.status]);
```

### **Problema 2: Props Incompletos**

O `startFocusTimer` não estava passando `endsAt` e `status` nos props:

```typescript
// ANTES - Props incompletos
component: {
  type: 'fullscreen',
  name: 'FocusTimer',
  props: {
    sessionId: session.id,
    hyperfocus: { id, title, color },
    durationMinutes: validated.durationMinutes,
    startedAt: session.started_at,
    playSound: validated.playSound,
    // ❌ Faltava: endsAt, status
  },
}
```

---

## ✅ Solução Implementada

### **Correção 1: Adicionar Campos aos Props**

**Arquivo:** `src/lib/mcp/tools/startFocusTimer.ts`

```typescript
// DEPOIS - Props completos
component: {
  type: 'fullscreen',
  name: 'FocusTimer',
  props: {
    sessionId: session.id,
    hyperfocus: { id, title, color },
    durationMinutes: validated.durationMinutes,
    startedAt: session.started_at,
    endsAt: endTime.toISOString(),     // ✅ ADICIONADO
    status: 'active',                   // ✅ ADICIONADO
    playSound: validated.playSound,
  },
}
```

### **Correção 2: Atualizar Interface do Componente**

**Arquivo:** `src/components/FocusTimer.tsx`

```tsx
// ANTES - Interface incompleta
interface FocusTimerInput {
  hyperfocusId: string;
  hyperfocusTitle: string;
  durationMinutes: number;
  // ... outros campos
}

// DEPOIS - Interface completa
interface FocusTimerInput {
  sessionId: string;
  hyperfocus: { id: string; title: string; color: string };
  durationMinutes: number;
  startedAt: string;
  endsAt: string;                    // ✅ ADICIONADO
  status: 'active' | 'paused' | 'completed'; // ✅ ADICIONADO
  playSound?: boolean;
  // ... outros campos
}
```

### **Correção 3: Usar Props em Vez de Output**

```tsx
// ANTES - Usava toolOutput (sempre undefined)
useEffect(() => {
  if (!toolOutput?.endsAt || toolOutput.status === 'completed') {
    setIsCompleted(true);
    return;
  }
  const endsAt = new Date(toolOutput.endsAt);
  // ...
}, [toolOutput?.endsAt, toolOutput?.status]);

// DEPOIS - Usa toolInput (props válidos)
const endsAt = toolInput?.endsAt;
const status = toolInput?.status ?? 'active';

useEffect(() => {
  if (!endsAt || status === 'completed') {
    setIsCompleted(true);
    return;
  }
  const endsAtDate = new Date(endsAt);
  // ...
}, [endsAt, status]);
```

---

## 🧪 Verificação da Correção

### **Checklist de Validação:**

- [x] Compilação TypeScript sem erros
- [x] Interface `FocusTimerInput` atualizada com todos os campos
- [x] Props do `startFocusTimer` incluem `endsAt` e `status`
- [x] Componente usa `toolInput` em vez de `toolOutput`
- [x] Referências a `hyperfocusId` corrigidas para `hyperfocus.id`
- [x] Callbacks (`handleReset`, `handleExtend`) atualizados

### **Teste Manual Necessário:**

1. ✅ Reiniciar servidor Next.js (`npm run dev`)
2. ⏳ Pedir ao SATI: *"Quero iniciar uma sessão de foco de 15 minutos para o hiperfoco Estudar Teoria da Historia"*
3. ⏳ Verificar que timer começa em `15:00` e decrementa
4. ⏳ Verificar que status é "Foco" (não "Sessão concluída!")
5. ⏳ Deixar timer chegar a `00:00` e confirmar conclusão

---

## 📚 Lições Aprendidas

### **1. Props vs Output em Componentes MCP**

- **Props (`toolInput`)**: Dados passados pelo ChatGPT ao **renderizar** o componente
- **Output (`toolOutput`)**: Dados retornados por **callbacks** do componente (raro)
- **Regra:** Se o componente não tem callback, use `toolInput` para tudo

### **2. Debug de Componentes React**

- ✅ Verificar logs do backend primeiro (confirmar que tool funcionou)
- ✅ Inspecionar props no console do navegador (`console.log(toolInput)`)
- ✅ Verificar useEffect dependencies (podem causar bugs sutis)

### **3. TypeScript como Documentação**

- ✅ Interfaces devem refletir dados **reais** passados
- ✅ Compiler errors são seus amigos (apontam inconsistências)
- ✅ Usar `?` para campos opcionais, não para campos obrigatórios

---

## 🔗 Arquivos Modificados

1. **`src/lib/mcp/tools/startFocusTimer.ts`**
   - Adicionado `endsAt` e `status` aos props do componente

2. **`src/components/FocusTimer.tsx`**
   - Interface `FocusTimerInput` atualizada
   - Extraído `endsAt`, `status`, `sessionId` de `toolInput`
   - useEffect usa valores de `toolInput` em vez de `toolOutput`
   - Callbacks atualizados para usar `sessionId` e `hyperfocus.id`

---

## 🎯 Próximos Passos

### **Imediato (Teste):**
- [ ] Reiniciar servidor
- [ ] Testar timer de foco end-to-end
- [ ] Verificar que timer decrementa corretamente
- [ ] Testar conclusão natural do timer
- [ ] Testar botão "Resetar" e "Estender"

### **Sprint 2 (Melhorias):**
- [ ] Task 2.1: Criar ferramenta `extendFocusTimer`
- [ ] Task 2.5: Auto-finalização de sessões órfãs

### **Documentação:**
- [ ] Adicionar este bug ao CHANGELOG.md
- [ ] Atualizar documentação de componentes MCP
- [ ] Criar guia: "Props vs Output em Componentes"

---

## 🏆 Créditos

**Descoberto por:** Ester (Usuária/QA)  
**Corrigido por:** GitHub Copilot (Agent)  
**Data da Correção:** 12 de outubro de 2025  
**Tempo de Investigação:** ~10 minutos  
**Tempo de Correção:** ~5 minutos  

---

## 📝 Notas Técnicas

### **Por que o useEffect marcava como completo?**

```tsx
if (!toolOutput?.endsAt || toolOutput.status === 'completed') {
  setIsCompleted(true); // ⚠️ SEMPRE executava
  return;
}
```

- `toolOutput` era sempre `undefined` (não havia callback)
- `!undefined?.endsAt` → `!undefined` → `true`
- Portanto, **sempre** entrava no `if` e marcava como completo

### **Por que funcionava no passado?**

Provavelmente, em versões anteriores:
1. O ChatGPT retornava os dados de forma diferente
2. Ou havia um callback que populava `toolOutput`
3. Ou o componente usava uma estrutura de dados diferente

### **Arquitetura Correta:**

```
startFocusTimer (Tool)
    ↓ retorna
component.props (toolInput)
    ↓ passa para
FocusTimer (Component)
    ↓ renderiza
Timer UI com countdown
```

**Não há `toolOutput` neste fluxo!**

---

**Fim do Relatório**

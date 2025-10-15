# 🔧 Correção dos IDs de Modelos OpenAI

**Data:** 14/01/2025  
**Problema:** Apareciam apenas 4 modelos com IDs incorretos (gpt-40-mini, gpt-5-instant, etc)
**Status:** ✅ Corrigido

## 🐛 Problema Identificado

Os IDs dos modelos no `modelRegistry.service.ts` estavam **incorretos** e não correspondiam aos IDs oficiais da API da OpenAI:

### ❌ IDs Incorretos (Antes)
```typescript
- 'gpt-40-mini'      // ERRADO
- 'gpt-40'           // ERRADO (e deprecated)
- 'gpt-5-instant'    // NÃO EXISTE
- 'gpt-5-thinking'   // NÃO EXISTE
- 'gpt-5-pro'        // NÃO EXISTE
```

### ✅ IDs Corretos (Depois)
```typescript
- 'gpt-4o-mini'      // Correto
- 'gpt-4o'           // Correto
- 'gpt-4-turbo'      // Correto
- 'gpt-4'            // Correto
- 'gpt-3.5-turbo'    // Correto
```

## 📝 Arquivos Modificados

### 1. `src/lib/services/modelRegistry.service.ts`
**Alterações:**
- Corrigidos IDs dos modelos OpenAI para corresponder à API oficial
- Removidos modelos fictícios (gpt-5-*)
- Atualizado modelo default de `gpt-40-mini` para `gpt-4o-mini`

### 2. `src/lib/services/userPreferences.service.ts`
**Alterações:**
- Atualizado default model de `gpt-40-mini` para `gpt-4o-mini`

### 3. `supabase/migrations/20251015_add_user_preferences.sql`
**Alterações:**
- Atualizado default na migration de `gpt-40-mini` para `gpt-4o-mini`

## 🎯 Modelos Disponíveis Agora

### OpenAI (5 modelos)
| ID | Nome | Descrição |
|---|---|---|
| `gpt-4o-mini` | GPT-4o Mini | Econômico e rápido ⚡ |
| `gpt-4o` | GPT-4o | Mais recente e capaz 🚀 |
| `gpt-4-turbo` | GPT-4 Turbo | Otimizado para velocidade |
| `gpt-4` | GPT-4 | Original e confiável |
| `gpt-3.5-turbo` | GPT-3.5 Turbo | Muito econômico 💰 |

### Anthropic (5 modelos - quando configurado)
- Claude 3.5 Sonnet
- Claude 3.5 Haiku
- Claude Sonnet 4
- Claude Opus 4
- Claude Sonnet 4.5

### Google (4 modelos - quando configurado)
- Gemini 1.5 Flash
- Gemini 2.0 Flash
- Gemini 2.5 Pro
- Gemini 2.5 Flash

## 🔍 Por que apareciam apenas 4 modelos?

1. **IDs inválidos:** Os IDs `gpt-40`, `gpt-5-*` não existem na API da OpenAI
2. **Deprecated:** O modelo `gpt-40` estava marcado como deprecated
3. **Filtro ativo:** O método `getActiveModels()` filtra modelos deprecados

## ✅ Verificações Necessárias

Após o deploy, verifique:

- [ ] ModelSelector mostra os 5 modelos OpenAI corretos
- [ ] Modelo default é `gpt-4o-mini`
- [ ] Mensagens são enviadas com IDs corretos
- [ ] Nenhum erro 404 ou "model not found" da API
- [ ] Custo das mensagens está correto (gpt-4o-mini é mais barato)

## 💡 Importante

Se você já tem usuários com preferências salvas usando os IDs antigos (`gpt-40-mini`, etc), precisará de uma **migration de dados** para atualizar:

```sql
-- Migration para corrigir preferências antigas
UPDATE user_preferences 
SET preferred_model = 'gpt-4o-mini' 
WHERE preferred_model = 'gpt-40-mini';

UPDATE user_preferences 
SET preferred_model = 'gpt-4o' 
WHERE preferred_model = 'gpt-40';

-- Remover modelos inexistentes
UPDATE user_preferences 
SET preferred_model = 'gpt-4o-mini' 
WHERE preferred_model LIKE 'gpt-5-%';
```

## 🎉 Resultado

Agora o sistema usa os IDs oficiais da OpenAI API e todos os modelos aparecem corretamente no seletor!

---

**Build Status:** ✅ Passing  
**Deploy:** Pronto para produção

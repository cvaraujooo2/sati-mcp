# 📝 Changelog - SATI MCP

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

---

## [1.2.0] - 14/01/2025

### 🎉 Novidades

#### ✨ Modo Beta - Free Tier Implementado
- **Sistema de acesso gratuito** com fallback usando `SYSTEM_OPENAI_KEY`
- Usuários novos podem usar o chat **imediatamente** sem configurar API key
- Banner informativo de beta aparece apenas para usuários sem API key
- Limites configuráveis: 10 mensagens/dia, 100/mês (padrão)
- Documentação completa: `BETA-FREE-TIER-IMPLEMENTATION.md`

#### 🎨 Melhorias de Interface

**ChatInterface (`src/app/components/chat/ChatInterface.tsx`)**
- ✅ **ModelSelector** integrado no header do chat (sempre visível)
- ✅ **UsageLimitBanner** adicionado para mostrar limites de uso
- ✅ **Banner de Beta** no empty state para usuários sem API key
- ✅ Removido bloqueio que exigia API key para usar o sistema
- ✅ Estado vazio redesenhado com call-to-action claro

**Settings Page (`src/app/(authenticated)/settings/page.tsx`)**
- ✅ **ModelWarningsBanner** adicionado ao topo da página
- ✅ Formulários de API key habilitados para Anthropic e Google
- ✅ Interface multi-provider completamente funcional
- ✅ Validação de chaves com feedback visual

### 🔧 Correções Críticas

#### 🐛 Fix: Model IDs Incorretos
**Problema:** Sistema usava IDs customizados que não existiam nas APIs oficiais
- `gpt-40-mini` → causava erro "No output generated"
- `gemini-25-pro` → não reconhecido pela API Google

**Solução Implementada:**
- ✅ Corrigidos todos os IDs em `modelRegistry.service.ts`
- ✅ Migration SQL criada: `supabase/migrations/20251015_fix_model_ids.sql`
- ✅ IDs agora seguem nomenclatura oficial das APIs

**IDs Corretos:**
- OpenAI: `gpt-4o-mini`, `gpt-4o`, `gpt-4-turbo`, `gpt-4`, `gpt-3.5-turbo`
- Google: `gemini-1.5-pro`, `gemini-1.5-flash`, `gemini-2.0-flash-exp`
- Anthropic: `claude-35-sonnet-20241022`, `claude-35-haiku-20241029`, etc.

**⚠️ Ação Necessária:** Executar migration no banco de produção (ver `MIGRATION-MODEL-IDS.md`)

#### 🐛 Fix: Validação Bloqueando Free Tier
**Problema:** `sendMessage()` exigia API key mesmo com fallback habilitado

**Solução:**
- Removida validação `hasApiKey` do hook `useChat` (`src/lib/chat/hooks.ts`)
- Sistema agora permite envio de mensagens usando `SYSTEM_OPENAI_KEY`
- Usuários beta podem usar o chat sem configuração

#### 🐛 Fix: Erro 406 em Tabela Não Migrada
**Problema:** Sistema quebrava quando `user_preferences` não existia no banco

**Solução:**
- Adicionado método `getDefaultPreferences()` no `userPreferences.service.ts`
- Fallback em memória quando detecta erro 406 ou PGRST116
- Sistema funciona mesmo durante processo de migration

#### 🐛 Fix: Importação do Progress Component
**Problema:** `UsageLimitBanner` importava de caminho errado

**Solução:**
- Corrigido import para `@/components/ui/progress` (padrão do projeto)
- Removido arquivo duplicado em `src/app/components/ui/progress.tsx`

### 🔨 Melhorias Técnicas

**Arquivos Modificados:**

1. **`src/app/components/chat/ChatInterface.tsx`**
   - Integração ModelSelector + UsageLimitBanner
   - Lógica de beta mode no empty state
   - Removido bloqueio de acesso sem API key

2. **`src/lib/chat/hooks.ts`**
   - Adicionado estado `usageInfo` do SSE
   - Removida validação `hasApiKey` do `sendMessage()`
   - Tratamento de evento `usage_info` no stream

3. **`src/lib/services/modelRegistry.service.ts`**
   - IDs corrigidos para todos os providers
   - Documentação dos modelos atualizada

4. **`src/lib/services/userPreferences.service.ts`**
   - Método `getDefaultPreferences()` adicionado
   - Error handling para tabelas não migradas (406, PGRST116)
   - Fallback gracioso sem quebrar o sistema

5. **`src/types/database.d.ts`**
   - Schema completo das tabelas `user_preferences` e `user_usage_limits`
   - Tipos TypeScript atualizados

6. **`src/app/(authenticated)/settings/page.tsx`**
   - ModelWarningsBanner integrado
   - Forms de Anthropic e Google habilitados

### 📚 Documentação Criada

- ✅ `BETA-FREE-TIER-IMPLEMENTATION.md` - Guia completo do modo beta
- ✅ `MIGRATION-MODEL-IDS.md` - Instruções de migration para IDs de modelos

### 🧪 Testes

- ✅ Build de produção passando (`npm run build`)
- ✅ TypeScript sem erros de compilação
- ✅ Todas as 19 rotas geradas corretamente
- ✅ Verificação de tipos completa

### 📊 Estatísticas do Build

```
Route (app)                              Size       First Load JS
├ ○ /chat                             64.7 kB        295 kB
├ ○ /settings                           10 kB        217 kB
├ ○ /hyperfocus                       11.2 kB        221 kB
└ ... (16 outras rotas)

✓ Compiled successfully
✓ Checking validity of types
✓ No errors found
```

### 🚀 Próximos Passos

1. **Aplicar Migration SQL** no banco de produção
2. **Deploy para Vercel** (código pronto)
3. **Configurar** `SYSTEM_OPENAI_KEY` no ambiente de produção
4. **Testar** integração Google Gemini com IDs corretos
5. **Monitorar** uso do free tier e rate limiting

### ⚠️ Breaking Changes

Nenhuma breaking change para usuários finais. Sistema mantém compatibilidade retroativa.

### 🔒 Segurança

- Rate limiting implementado para free tier (10/dia, 100/mês)
- API keys dos usuários continuam armazenadas com segurança
- Fallback key do sistema isolada e protegida

---

## [1.1.0] - Anterior

### 🎯 Ações Prioritárias 1 e 2 (Implementadas)

**Ação 1: Integração ModelSelector + UsageLimitBanner**
- Components integrados no ChatInterface
- Funcionamento em empty state e com mensagens

**Ação 2: Settings com Multi-Provider**
- ModelWarningsBanner adicionado
- Forms de Anthropic e Google habilitados
- Validação de API keys funcionando

---

## Formato

O changelog segue o padrão [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

### Tipos de Mudanças

- **🎉 Novidades** - Novas funcionalidades
- **🔧 Correções** - Bug fixes
- **🔨 Melhorias** - Melhorias em funcionalidades existentes
- **🗑️ Removido** - Funcionalidades removidas
- **⚠️ Deprecated** - Funcionalidades que serão removidas
- **🔒 Segurança** - Correções de segurança
- **📚 Documentação** - Mudanças em documentação

# Guia de Implementação: Sistema Multi-Provider + Fallback API

## 📋 Resumo da Implementação

Implementamos um sistema completo de alternância entre provedores de IA (OpenAI, Anthropic, Google) com:

- ✅ Suporte a múltiplos provedores e modelos
- ✅ Sistema de fallback gratuito (Free Tier)
- ✅ Persistência de preferências do usuário
- ✅ Validação de API keys
- ✅ Avisos sobre modelos deprecados/novos
- ✅ Rate limiting para Free Tier
- ✅ UI completa com seletores e banners

## 🗄️ Migrações SQL Necessárias

Execute as seguintes migrations no Supabase:

### 1. Tabela `user_preferences`
```bash
supabase migration new add_user_preferences
# Copie o conteúdo de: supabase/migrations/20251015_add_user_preferences.sql
```

### 2. Tabela `user_usage_limits`
```bash
supabase migration new add_user_usage_limits
# Copie o conteúdo de: supabase/migrations/20251015_add_user_usage_limits.sql
```

### 3. Aplicar Migrations
```bash
# Local
supabase db reset

# Produção
supabase db push
```

## 🔑 Variáveis de Ambiente

Adicione ao `.env.local`:

```env
# System API Keys (para Free Tier Fallback)
SYSTEM_OPENAI_KEY=sk-your-openai-key-here
SYSTEM_ANTHROPIC_KEY=sk-ant-your-anthropic-key-here
SYSTEM_GOOGLE_KEY=your-google-ai-key-here

# Rate Limiting
FREE_TIER_DAILY_LIMIT=10
FREE_TIER_MONTHLY_LIMIT=100
```

**Importante:** Se não configurar `SYSTEM_OPENAI_KEY`, o sistema vai exigir que todos os usuários configurem suas próprias keys.

## 📦 Pacotes Instalados

```bash
npm install @ai-sdk/anthropic @ai-sdk/google @radix-ui/react-progress
```

## 🏗️ Arquitetura Implementada

### Services Criados

1. **`modelRegistry.service.ts`**
   - Lista hardcoded de modelos (OpenAI, Anthropic, Google)
   - Detecção de modelos deprecados e novos
   - Validação e fallbacks

2. **`userPreferences.service.ts`**
   - CRUD de preferências do usuário
   - Gerenciamento de avisos dismissados
   - Auto-criação de preferências default

3. **`usageLimits.service.ts`**
   - Controle de rate limiting para Free Tier
   - Atualização de tier (free → byok)
   - Estatísticas de uso

### Componentes UI Criados

1. **`ModelSelector.tsx`**
   - Dropdown com todos os modelos disponíveis
   - Agrupado por provider
   - Badges para deprecated/novo
   - Tooltips informativos

2. **`UsageLimitBanner.tsx`**
   - Banner no chat mostrando uso do Free Tier
   - Progress bars (diário/mensal)
   - CTA para configurar API key
   - Variantes: info/warning/critical

3. **`ModelWarningsBanner.tsx`**
   - Avisos sobre modelos em Settings
   - Dismissível individualmente
   - Ações contextuais

### Atualizações em Arquivos Existentes

1. **`/api/chat/route.ts`**
   - Suporte a múltiplos provedores (OpenAI, Anthropic, Google)
   - Sistema de fallback com rate limiting
   - Envio de usage_info via SSE
   - Incremento automático de contadores

2. **`/api/settings/validate-key/route.ts`**
   - Validação expandida para todos os provedores
   - Detecção de modelos disponíveis

3. **`useChat` hook**
   - Carregamento de preferências do usuário
   - Filtro de modelos por providers disponíveis
   - Persistência de mudanças de modelo

4. **`types.ts`**
   - Novos tipos: `UserPreferences`, `UsageInfo`, `ModelWarning`
   - `ModelDefinition` expandido

## 🎯 Lista de Modelos Suportados

### OpenAI
- ✅ gpt-40-mini
- ⚠️ gpt-40 (deprecated → gpt-5-instant)
- ✅ gpt-5-instant
- ✅ gpt-5-thinking
- ✅ gpt-5-pro (mais recente)

### Anthropic
- ✅ claude-35-sonnet-20241022
- ✅ claude-35-haiku-20241029
- ✅ claude-sonnet-4
- ✅ claude-opus-4
- ✅ claude-sonnet-4.5 (lançado em set/2025)

### Google
- ⚠️ gemini-15-pro (deprecated → gemini-25-pro)
- ✅ gemini-15-flash
- ✅ gemini-20-flash
- ✅ gemini-25-pro (mais recente, 1M tokens)

## 🔄 Fluxo de Uso

### 1. Novo Usuário (Free Tier)
1. Usuário faz login
2. Sistema cria preferências default (OpenAI/gpt-40-mini)
3. Sistema cria usage_limits (tier: free)
4. Usuário pode enviar até 10 mensagens/dia usando fallback
5. Banner aparece no chat mostrando uso
6. Ao atingir limite, sistema bloqueia com erro 429

### 2. Usuário Configura API Key
1. Vai em Settings > API Keys
2. Adiciona key do provider desejado (ex: OpenAI)
3. Sistema valida imediatamente
4. Tier muda para 'byok' (uso ilimitado)
5. Banner de Free Tier desaparece
6. Pode selecionar modelos do provider configurado

### 3. Troca de Modelo
1. Usuário clica no ModelSelector no chat
2. Escolhe modelo de outro provider
3. Hook persiste preferência no backend
4. Próxima mensagem usa novo modelo

## 🚀 Como Testar

### Teste 1: Free Tier
```bash
1. Crie novo usuário
2. Não configure API key
3. Envie mensagem no chat
4. Verifique banner de Free Tier aparecendo
5. Envie 10 mensagens
6. Tente enviar 11ª mensagem → deve receber erro 429
```

### Teste 2: BYOK
```bash
1. Configure API key da OpenAI em Settings
2. Banner de Free Tier deve desaparecer
3. Envie quantas mensagens quiser
4. Adicione API key da Anthropic
5. ModelSelector deve mostrar modelos Claude
6. Selecione Claude e envie mensagem
```

### Teste 3: Avisos de Modelos
```bash
1. Configure preferências para usar gpt-40 (deprecated)
2. Vá em Settings
3. Deve ver banner de aviso sobre deprecation
4. Clique "Não mostrar novamente"
5. Aviso deve sumir
```

## ⚙️ Configuração de Cron Jobs (Supabase)

Para resetar os limites diários/mensais, configure cron jobs:

```sql
-- Resetar limites diários (todo dia à meia-noite)
SELECT cron.schedule(
  'reset-daily-usage-limits',
  '0 0 * * *',
  $$SELECT reset_daily_usage_limits()$$
);

-- Resetar limites mensais (todo dia 1 às 00:00)
SELECT cron.schedule(
  'reset-monthly-usage-limits',
  '0 0 1 * *',
  $$SELECT reset_monthly_usage_limits()$$
);
```

## 📊 Monitoramento

### Queries Úteis

**Uso agregado do Free Tier:**
```sql
SELECT 
  COUNT(*) as total_users,
  SUM(daily_requests_used) as total_daily,
  SUM(monthly_requests_used) as total_monthly,
  AVG(daily_requests_used) as avg_daily
FROM user_usage_limits
WHERE tier = 'free';
```

**Usuários próximos do limite:**
```sql
SELECT 
  user_id,
  daily_requests_used,
  monthly_requests_used
FROM user_usage_limits
WHERE tier = 'free'
  AND (daily_requests_used >= 8 OR monthly_requests_used >= 80);
```

**Modelos mais usados:**
```sql
SELECT 
  preferred_provider,
  preferred_model,
  COUNT(*) as count
FROM user_preferences
GROUP BY preferred_provider, preferred_model
ORDER BY count DESC;
```

## 🐛 Troubleshooting

### Erro: "System API key not configured"
- **Causa:** `SYSTEM_OPENAI_KEY` não está no `.env.local`
- **Solução:** Configure a key ou desabilite fallback

### Erro: "Invalid model ID"
- **Causa:** Modelo não existe no registry
- **Solução:** Verifique `modelRegistry.service.ts`

### Avisos não aparecem
- **Causa:** Já foram dismissados
- **Solução:** Use `resetDismissedWarnings()` no service

### Free Tier não funciona
- **Causa:** Migrations não aplicadas
- **Solução:** Execute `supabase db reset` ou `push`

## 📝 Próximos Passos

- [ ] Dashboard admin para monitorar uso
- [ ] Modal de tutorial para configurar API key
- [ ] Detecção automática de novos modelos via API
- [ ] Suporte a DeepSeek e Ollama
- [ ] Testes unitários e de integração
- [ ] Documentação de API para MCP

## 💡 Dicas

1. **Custos**: Com free tier de 10 msg/dia, 100 usuários = ~$22.50/mês
2. **Segurança**: API keys do sistema devem estar em env vars, nunca no código
3. **Performance**: Services usam Singleton pattern para cache
4. **UX**: Banner muda cor baseado no uso (info/warning/critical)

---

**Documentação criada em:** 15/10/2025  
**Versão:** 1.0.0


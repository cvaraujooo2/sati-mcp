# 🔍 AUDITORIA: Funcionalidade de Configurar API Key

**Data**: 11 de Outubro de 2025  
**Rota**: `/settings`  
**Status**: ✅ **FUNCIONAL COM RESSALVAS DE SEGURANÇA**  

---

## 📊 Resumo Executivo

A funcionalidade de configurar API Key está **implementada e funcional**, mas possui **questões críticas de segurança** que precisam ser endereçadas.

### Pontos Positivos ✅
- Interface completa e bem desenhada
- Validação em tempo real
- Integração com Supabase
- Fluxo de UX bem pensado
- Autenticação obrigatória

### Pontos Críticos ⚠️
- **API Keys armazenadas em texto plano** (vulnerabilidade crítica)
- Validação client-side expõe keys
- Falta de rate limiting
- Sem auditoria de acesso

---

## 🔍 Análise Detalhada

### 1️⃣ **Página Settings** (`src/app/settings/page.tsx`)

#### ✅ Funcionalidades Implementadas:

```typescript
- Carregamento de API keys existentes
- Suporte múltiplos providers (OpenAI, Anthropic, Google)
- UI clara com tabs
- Indicadores de status (configurado/não configurado)
- Loading states
```

#### ✅ Pontos Fortes:

1. **Proteção por Autenticação**: Rota protegida pelo middleware
2. **UX Bem Pensada**: Interface intuitiva com ícones e badges
3. **Multi-Provider**: Preparado para múltiplos providers
4. **Feedback Visual**: Estados claros para o usuário

#### ⚠️ Pontos de Atenção:

```typescript
// Linha 44 - Carrega keys sem verificar permissões adicionais
const keys = await apiKeyService.listApiKeys()
```

**Recomendação**: Adicionar verificação de rate limiting client-side.

---

### 2️⃣ **Componente ApiKeyForm** (`src/components/settings/ApiKeyForm.tsx`)

#### ✅ Funcionalidades Implementadas:

```typescript
- Input com show/hide password
- Validação em tempo real (debounced 1s)
- Teste de API key armazenada
- Remoção de API key
- Estados de loading para cada ação
```

#### ✅ Pontos Fortes:

1. **Debounce**: Evita validações excessivas (1 segundo)
2. **Estados Claros**: Loading, sucesso, erro bem definidos
3. **Feedback Visual**: Ícones e mensagens apropriadas
4. **Teste de Key**: Permite testar key salva

#### ⚠️ Pontos de Atenção:

```typescript
// Linha 74-81 - Validação expõe a API key no client-side
const result = await apiKeyService.validateApiKey(provider, apiKey)
```

**Problema**: A validação acontece diretamente do frontend, expondo a API key em:
- Network requests (visível no DevTools)
- Logs do console
- Possível XSS

**Recomendação**: Mover validação para endpoint backend.

---

### 3️⃣ **Service ApiKeyService** (`src/lib/services/apiKey.service.ts`)

#### ✅ Funcionalidades Implementadas:

```typescript
- saveApiKey(): Salva ou atualiza key
- getApiKey(): Recupera key do usuário
- removeApiKey(): Remove key
- listApiKeys(): Lista todas as keys
- validateApiKey(): Valida key com provider
```

#### 🚨 **VULNERABILIDADES CRÍTICAS**:

##### 1. **API Keys em Texto Plano**

```typescript
// Linha 44 - CRÍTICO: Keys não são criptografadas
const keyData: UserApiKeyInsert = {
  user_id: user.id,
  provider,
  encrypted_key: apiKey, // ❌ NÃO está criptografado apesar do nome
  last_used_at: new Date().toISOString()
}
```

**Risco**: 
- Qualquer acesso ao banco de dados expõe todas as keys
- Dump de banco vaza keys de todos os usuários
- Admin do Supabase pode ver as keys

**Impacto**: **CRÍTICO** 🔴

##### 2. **Validação Client-Side Expõe Keys**

```typescript
// Linhas 182-210 - Validação direta do frontend
private async validateOpenAIKey(apiKey: string): Promise<ApiKeyValidationResult> {
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: {
      'Authorization': `Bearer ${apiKey}`, // ❌ Key visível no network
    }
  })
}
```

**Risco**:
- API key visível no Network tab do DevTools
- Pode ser interceptada por extensions maliciosas
- Exposta em logs de erro

**Impacto**: **ALTO** 🟠

##### 3. **Sem Rate Limiting**

```typescript
// Nenhum controle de rate limiting implementado
async saveApiKey() { /* ... */ }
async validateApiKey() { /* ... */ }
```

**Risco**:
- Possível abuso da validação (custo na OpenAI)
- Brute force em keys
- DDoS no endpoint de validação

**Impacto**: **MÉDIO** 🟡

---

### 4️⃣ **Integração com Chat API** (`src/app/api/chat/route.ts`)

#### ✅ Implementação Correta:

```typescript
// Linhas 293-301 - Busca key do backend
const { data: apiKeyData, error: keyError } = await supabase
  .from('user_api_keys')
  .select('encrypted_key')
  .eq('user_id', userId)
  .eq('provider', 'openai')
  .single()
```

**Pontos Positivos**:
- ✅ Busca feita no backend (seguro)
- ✅ Filtra por user_id (RLS quando habilitado)
- ✅ Erro claro quando não encontrada
- ✅ Não expõe key no response

---

## 🛡️ Avaliação de Segurança

### Matriz de Risco:

| Vulnerabilidade | Severidade | Probabilidade | Risco Total | Status |
|-----------------|------------|---------------|-------------|--------|
| Keys em texto plano | 🔴 Crítica | Alta | 🔴 **Crítico** | ❌ Não mitigado |
| Validação client-side | 🟠 Alta | Média | 🟠 **Alto** | ❌ Não mitigado |
| Sem rate limiting | 🟡 Média | Alta | 🟡 **Médio** | ❌ Não mitigado |
| RLS não habilitado | 🟠 Alta | Alta | 🔴 **Crítico** | ❌ Não mitigado |
| Sem auditoria | 🟡 Baixa | Baixa | 🟢 **Baixo** | ⚠️ Opcional |

---

## 🔧 Correções Necessárias

### 🔴 **CRÍTICAS** (Implementar URGENTEMENTE)

#### 1. Criptografar API Keys no Banco

**Solução Recomendada**: Usar Supabase Vault

```typescript
// Criar função no Supabase para criptografar
CREATE OR REPLACE FUNCTION encrypt_api_key(key text)
RETURNS bytea AS $$
BEGIN
  RETURN pgp_sym_encrypt(key, current_setting('app.encryption_key'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

// No código:
const { data, error } = await supabase.rpc('encrypt_api_key', {
  key: apiKey
})
```

**Alternativa**: Criptografar client-side antes de enviar

```typescript
import crypto from 'crypto'

function encryptKey(apiKey: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(process.env.ENCRYPTION_KEY!),
    iv
  )
  let encrypted = cipher.update(apiKey, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}
```

#### 2. Habilitar RLS na Tabela user_api_keys

```sql
-- Habilitar RLS
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- Política: usuário só vê suas próprias keys
CREATE POLICY "Users can only view their own API keys"
  ON user_api_keys
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: usuário só pode inserir suas próprias keys
CREATE POLICY "Users can only insert their own API keys"
  ON user_api_keys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: usuário só pode atualizar suas próprias keys
CREATE POLICY "Users can only update their own API keys"
  ON user_api_keys
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: usuário só pode deletar suas próprias keys
CREATE POLICY "Users can only delete their own API keys"
  ON user_api_keys
  FOR DELETE
  USING (auth.uid() = user_id);
```

---

### 🟠 **ALTAS** (Implementar em até 1 semana)

#### 3. Mover Validação para Backend

Criar endpoint `/api/settings/validate-key`:

```typescript
// src/app/api/settings/validate-key/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { provider, apiKey } = await req.json()
  
  // Validar aqui no backend, não retornar key no response
  const result = await validateKey(provider, apiKey)
  
  return NextResponse.json({ 
    isValid: result.isValid,
    model: result.model,
    error: result.error
  })
}
```

---

### 🟡 **MÉDIAS** (Implementar em até 2 semanas)

#### 4. Implementar Rate Limiting

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 validações por hora
})

export async function checkRateLimit(userId: string): Promise<boolean> {
  const { success } = await ratelimit.limit(userId)
  return success
}
```

#### 5. Adicionar Logs de Auditoria

```typescript
// Criar tabela de auditoria
CREATE TABLE api_key_audit (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users NOT NULL,
  action text NOT NULL, -- 'created', 'updated', 'validated', 'removed'
  provider text NOT NULL,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);
```

---

## ✅ Checklist de Conformidade

### Segurança:
- [ ] **API keys criptografadas no banco**
- [ ] **RLS habilitado em user_api_keys**
- [ ] **Validação movida para backend**
- [ ] **Rate limiting implementado**
- [ ] **Logs de auditoria**
- [ ] **HTTPS obrigatório em produção**

### Funcionalidade:
- [x] Salvar API key
- [x] Recuperar API key
- [x] Remover API key
- [x] Validar API key
- [x] Listar API keys
- [x] UI funcional

### UX:
- [x] Loading states
- [x] Mensagens de erro claras
- [x] Feedback visual
- [x] Show/hide password
- [x] Debounce em validação

### Código:
- [x] TypeScript correto
- [x] Sem erros de compilação
- [x] Service pattern
- [ ] Testes unitários
- [ ] Testes de integração

---

## 📊 Score Final

| Aspecto | Score | Status |
|---------|-------|--------|
| **Funcionalidade** | 9/10 | ✅ Excelente |
| **UX/UI** | 9/10 | ✅ Excelente |
| **Segurança** | 3/10 | 🔴 **CRÍTICO** |
| **Performance** | 7/10 | 🟡 Bom |
| **Manutenibilidade** | 8/10 | ✅ Muito Bom |
| **TOTAL** | **6.4/10** | 🟡 **Funcional mas INSEGURO** |

---

## 🎯 Recomendações Prioritárias

### Para Deploy em Produção:

1. **BLOQUEADOR**: Implementar criptografia de API keys
2. **BLOQUEADOR**: Habilitar RLS
3. **BLOQUEADOR**: Mover validação para backend
4. **RECOMENDADO**: Implementar rate limiting
5. **OPCIONAL**: Adicionar auditoria

### Para Continuar em Desenvolvimento:

✅ Pode usar, mas:
- Não compartilhar banco de dados de dev
- Usar keys de teste
- Limpar banco periodicamente
- Não expor publicamente

---

## 💡 Melhorias Futuras (Nice to Have)

1. **Suporte a múltiplas keys** por provider (backup keys)
2. **Rotação automática** de keys
3. **Notificações** de uso próximo ao limite
4. **Dashboard** de uso de tokens
5. **Keys com permissões** específicas (read-only, etc)
6. **Expiração** automática de keys
7. **2FA** para operações sensíveis

---

## 🎉 Conclusão

A funcionalidade **ESTÁ FUNCIONAL** do ponto de vista de UX e features, mas tem **vulnerabilidades críticas de segurança**.

**Veredito Final**: 
- ✅ **OK para desenvolvimento/testes**
- 🔴 **NÃO PRONTO para produção** (requer correções de segurança)

**Próxima Ação Recomendada**:
```
"Implemente criptografia de API keys usando Supabase Vault"
```

Ou:

```
"Habilite RLS na tabela user_api_keys"
```

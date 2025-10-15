# 🔧 Migration de IDs de Modelos - Instruções

**Data:** 14/01/2025  
**Problema:** IDs de modelos estavam usando nomenclatura customizada ao invés dos IDs oficiais das APIs
**Ação Necessária:** Executar migration no banco de dados

## ⚠️ Impacto

### Usuários Afetados
Todos os usuários que já têm preferências de modelo salvas com os IDs antigos:
- `gpt-40-mini` → precisa virar `gpt-4o-mini`
- `gemini-25-pro` → precisa virar `gemini-1.5-pro`
- `gpt-5-*` → precisa virar modelos GPT-4 válidos

### Sintoma
Sem a migration, usuários com modelos antigos salvos receberão o erro:
```
"No output generated. Check the stream for errors."
```

Porque a API não reconhece os IDs customizados.

## 🚀 Como Aplicar a Migration

### Opção 1: Banco Local (Desenvolvimento)
```bash
# Se tiver Supabase local rodando
cd /home/ester/Documentos/sati-mcp
supabase db reset

# Ou aplicar apenas a nova migration
supabase migration up
```

### Opção 2: Banco de Produção (Vercel/Supabase)
```bash
# Aplicar migration no projeto remoto
supabase db push

# Ou via Supabase Dashboard
# 1. Acesse: https://supabase.com/dashboard
# 2. Selecione seu projeto
# 3. Vá em "SQL Editor"
# 4. Cole o conteúdo de supabase/migrations/20251015_fix_model_ids.sql
# 5. Execute (Run)
```

### Opção 3: Manual via SQL Editor
Se preferir executar manualmente, copie e execute este SQL:

```sql
-- Corrigir IDs OpenAI
UPDATE user_preferences 
SET preferred_model = 'gpt-4o-mini', updated_at = NOW()
WHERE preferred_model = 'gpt-40-mini';

UPDATE user_preferences 
SET preferred_model = 'gpt-4o', updated_at = NOW()
WHERE preferred_model = 'gpt-40';

-- Corrigir IDs Google
UPDATE user_preferences 
SET preferred_model = 'gemini-1.5-pro', updated_at = NOW()
WHERE preferred_model IN ('gemini-15-pro', 'gemini-25-pro');

UPDATE user_preferences 
SET preferred_model = 'gemini-1.5-flash', updated_at = NOW()
WHERE preferred_model = 'gemini-15-flash';

UPDATE user_preferences 
SET preferred_model = 'gemini-2.0-flash-exp', updated_at = NOW()
WHERE preferred_model = 'gemini-20-flash';
```

## ✅ Verificação Pós-Migration

Execute para confirmar que a migration funcionou:

```sql
-- Ver distribuição de modelos após migration
SELECT 
    preferred_model, 
    COUNT(*) as user_count 
FROM user_preferences 
GROUP BY preferred_model 
ORDER BY user_count DESC;

-- Verificar se ainda existem IDs antigos
SELECT preferred_model 
FROM user_preferences 
WHERE preferred_model LIKE '%40%' 
   OR preferred_model LIKE '%15-%' 
   OR preferred_model LIKE '%25-%'
   OR preferred_model LIKE 'gpt-5-%';
```

### Resultado Esperado
- ✅ Nenhum registro com IDs antigos
- ✅ Apenas IDs oficiais: `gpt-4o-mini`, `gpt-4o`, `gemini-1.5-pro`, etc.

## 📋 IDs Corretos por Provider

### OpenAI
| ID Oficial | Nome |
|---|---|
| `gpt-4o-mini` | GPT-4o Mini |
| `gpt-4o` | GPT-4o |
| `gpt-4-turbo` | GPT-4 Turbo |
| `gpt-4` | GPT-4 |
| `gpt-3.5-turbo` | GPT-3.5 Turbo |

### Anthropic (já estavam corretos)
| ID Oficial | Nome |
|---|---|
| `claude-35-sonnet-20241022` | Claude 3.5 Sonnet |
| `claude-35-haiku-20241029` | Claude 3.5 Haiku |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-opus-4` | Claude Opus 4 |
| `claude-sonnet-4.5` | Claude Sonnet 4.5 |

### Google
| ID Oficial | Nome |
|---|---|
| `gemini-1.5-pro` | Gemini 1.5 Pro |
| `gemini-1.5-flash` | Gemini 1.5 Flash |
| `gemini-2.0-flash-exp` | Gemini 2.0 Flash (Experimental) |

## 🔍 Troubleshooting

### "No output generated" persiste após migration
1. Limpe o cache do navegador
2. Faça logout e login novamente
3. Verifique se o modelo salvo está correto:
```sql
SELECT preferred_model FROM user_preferences WHERE user_id = 'SEU_USER_ID';
```

### Usuário ainda vê modelo antigo no UI
- Force refresh (Ctrl+Shift+R)
- Ou mude manualmente o modelo nas configurações

### API key do Google não funciona
- Verifique se a chave está correta em Settings
- Teste com `gemini-1.5-flash` (mais rápido e barato)
- Veja logs no console do navegador

## 🎯 Próximos Passos Após Migration

1. ✅ Deploy do código atualizado (já feito com npm run build)
2. ✅ Aplicar migration no banco de dados (esta etapa)
3. ✅ Testar com cada provider (OpenAI, Google, Anthropic)
4. ✅ Monitorar logs de erro por 24h
5. ✅ Comunicar usuários beta sobre a mudança (opcional)

---

**Status:** ⏳ Aguardando execução da migration  
**Prioridade:** 🔴 Alta (usuários com Google estão com erro)

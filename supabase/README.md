# 📁 Supabase SQL Scripts - SATI MCP

Estrutura organizada dos scripts SQL para o banco de dados Supabase do projeto SATI MCP.

## 🏗️ Estrutura de Pastas

### 📋 `schemas/`
**Scripts de definição de schema e estrutura do banco**
- `schema-v2-production.sql` - ✅ Schema completo V2.0 production-ready
- `conversation-schema.sql` - Schema para sistema de conversas/chat
- `sql.sql` - Schema básico/simplificado

### 🔒 `security/`
**Scripts relacionados à segurança e controle de acesso**
- `enable-rls-production.sql` - Habilita Row Level Security para produção

### 🛠️ `development/`
**Scripts para ambiente de desenvolvimento**
- `disable-rls-conversations.sql` - Desabilita RLS para conversas (dev)
- `disable-rls-dev.sql` - Desabilita RLS geral (dev)
- `disable-rls-user-api-keys-dev.sql` - Desabilita RLS para API keys (dev)
- `quick-disable-rls-conversations.sql` - Desabilita RLS rapidamente

### 🧪 `testing/`
**Scripts para setup de testes e dados de teste**
- `setup-test-user-with-api-key.sql` - Setup completo de usuário de teste
- `create-test-user.sql` - Criação simples de usuário de teste
- `add-user-api-keys.sql` - Adiciona chaves API para usuários
- `insert-api-key-only.sql` - Inserção rápida de API key

### 🔧 `maintenance/`
**Scripts de manutenção, limpeza e inspeção**
- `clean-test-data.sql` - Limpa dados de teste antigos
- `inspect-database-schema.sql` - Inspeção completa do schema (378 linhas!)
- `simple-database-info.sql` - Informações básicas do banco

## 🚀 Como Usar

### 1. Setup Inicial (Produção)
```sql
-- 1. Criar schema completo
\i schemas/schema-v2-production.sql

-- 2. Adicionar schema de conversas
\i schemas/conversation-schema.sql

-- 3. Habilitar segurança
\i security/enable-rls-production.sql
```

### 2. Setup para Desenvolvimento
```sql
-- 1. Criar schema
\i schemas/schema-v2-production.sql

-- 2. Desabilitar RLS para desenvolvimento
\i development/disable-rls-dev.sql

-- 3. Criar usuário de teste
\i testing/setup-test-user-with-api-key.sql
```

### 3. Manutenção
```sql
-- Limpar dados de teste
\i maintenance/clean-test-data.sql

-- Inspecionar estrutura
\i maintenance/inspect-database-schema.sql
```

## 📊 Funcionalidades do Sistema

### 🧠 Para Neurodivergência
- **Hyperfocus**: Áreas de interesse intenso com cores e estimativas de tempo
- **Tasks**: Tarefas organizadas por hiperfoco
- **Focus Sessions**: Sessões cronometradas de trabalho
- **Alternancy**: Sistema de alternância de atividades

### 💬 Para Chat/Conversas
- **Conversations**: Histórico completo de conversas
- **Messages**: Estrutura JSONB flexível
- **Metadata**: Dados extensíveis por conversa

### 🔐 Segurança
- **RLS**: Row Level Security completo
- **User Isolation**: Dados isolados por usuário (`auth.uid()`)
- **API Keys**: Gerenciamento seguro de chaves OpenAI

## 📝 Versionamento

- **V2.0** (09/10/2025) - Production Ready
- **V1.0** - Versão inicial (deprecated)

## 🎯 Próximos Passos

1. Implementar backup automático
2. Adicionar scripts de migração entre versões
3. Criar scripts de monitoramento de performance
4. Implementar logs de auditoria

---

**Status**: ✅ Organização completa - 10/10/2025  
**Autor**: SATI MCP Team  
**Projeto**: Sistema de Apoio à Tarefa Intensiva - Model Context Protocol
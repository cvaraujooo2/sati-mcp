-- Tabela para armazenar histórico de conversas
-- Baseada no padrão MCPJam/inspector adaptado para Supabase

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Nova Conversa',
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_user_updated ON conversations(user_id, updated_at DESC);

-- Índice GIN para busca full-text nas mensagens
CREATE INDEX IF NOT EXISTS idx_conversations_messages_search ON conversations USING GIN(messages);

-- RLS (Row Level Security) para isolamento por usuário
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas suas próprias conversas
CREATE POLICY "Users can view own conversations" ON conversations
    FOR SELECT USING (auth.uid() = user_id);

-- Política para permitir que usuários criem conversas
CREATE POLICY "Users can create own conversations" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para permitir que usuários atualizem suas próprias conversas
CREATE POLICY "Users can update own conversations" ON conversations
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para permitir que usuários deletem suas próprias conversas
CREATE POLICY "Users can delete own conversations" ON conversations
    FOR DELETE USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Tabela para logs de execução de ferramentas (tracking de tool calls)
CREATE TABLE IF NOT EXISTS tool_execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    tool_name TEXT NOT NULL,
    tool_call_id TEXT NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    result JSONB,
    error_message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executing', 'completed', 'error')),
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Índices para tool execution logs
CREATE INDEX IF NOT EXISTS idx_tool_logs_user_id ON tool_execution_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_logs_conversation_id ON tool_execution_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_tool_logs_tool_name ON tool_execution_logs(tool_name);
CREATE INDEX IF NOT EXISTS idx_tool_logs_status ON tool_execution_logs(status);
CREATE INDEX IF NOT EXISTS idx_tool_logs_created_at ON tool_execution_logs(created_at DESC);

-- RLS para tool execution logs
ALTER TABLE tool_execution_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tool logs" ON tool_execution_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tool logs" ON tool_execution_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tool logs" ON tool_execution_logs
    FOR UPDATE USING (auth.uid() = user_id);

-- View para estatísticas de uso de ferramentas
CREATE OR REPLACE VIEW tool_usage_stats AS
SELECT 
    user_id,
    tool_name,
    COUNT(*) as total_executions,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_executions,
    COUNT(CASE WHEN status = 'error' THEN 1 END) as failed_executions,
    AVG(execution_time_ms) as avg_execution_time_ms,
    MIN(created_at) as first_used,
    MAX(created_at) as last_used
FROM tool_execution_logs
GROUP BY user_id, tool_name;

-- Grant access to the view
ALTER VIEW tool_usage_stats OWNER TO postgres;
GRANT SELECT ON tool_usage_stats TO authenticated;

-- Função para limpeza automática de conversas antigas (opcional)
CREATE OR REPLACE FUNCTION cleanup_old_conversations()
RETURNS void AS $$
BEGIN
    -- Remove conversas sem atividade há mais de 6 meses
    DELETE FROM conversations 
    WHERE updated_at < NOW() - INTERVAL '6 months';
    
    -- Remove logs de ferramentas há mais de 3 meses
    DELETE FROM tool_execution_logs 
    WHERE created_at < NOW() - INTERVAL '3 months';
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE conversations IS 'Armazena histórico de conversas dos usuários com o SATI, incluindo tool calls e resultados';
COMMENT ON TABLE tool_execution_logs IS 'Log detalhado de execuções de ferramentas para análise e debugging';
COMMENT ON VIEW tool_usage_stats IS 'Estatísticas de uso de ferramentas por usuário';

-- Exemplo de query para buscar conversas com tool calls específicos
-- SELECT DISTINCT c.id, c.title, c.updated_at 
-- FROM conversations c
-- WHERE c.user_id = 'user-uuid'
-- AND c.messages @> '[{"toolCalls": [{"name": "createHyperfocus"}]}]'
-- ORDER BY c.updated_at DESC;
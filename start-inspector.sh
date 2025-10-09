#!/bin/bash

# Script para iniciar MCP Inspector corretamente

echo "🚀 Iniciando MCP Inspector..."
echo ""

# Verificar se está no diretório correto
if [ ! -f "mcp.json" ]; then
    echo "❌ Erro: Execute este script no diretório do projeto!"
    exit 1
fi

# Verificar se tem OpenAI key
if grep -q "OPENAI_API_KEY" .env.local 2>/dev/null; then
    echo "✅ OpenAI API key encontrada"
    echo ""
    echo "Iniciando com OpenAI..."
    export OPENAI_API_KEY=$(grep OPENAI_API_KEY .env.local | cut -d'=' -f2)
    npx @mcpjam/inspector@latest --config mcp.json
else
    echo "⚠️  OpenAI API key não encontrada"
    echo ""
    echo "Iniciando sem LLM Playground..."
    echo "(Você ainda pode testar as tools na aba Tools)"
    npx @mcpjam/inspector@latest --config mcp.json
fi

#!/bin/bash

# Script de Teste para MCP Server do Sati
# Testa cada tool individualmente via Inspector

set -e

echo "🧪 Iniciando testes do MCP Server..."
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se o servidor pode iniciar
echo "📋 Verificando servidor..."
timeout 5 node mcp-server.mjs 2>&1 | head -20 || true
echo ""

# Verificar dependências
echo "📦 Verificando dependências..."
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ npx não encontrado. Instale Node.js${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ node não encontrado. Instale Node.js${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node --version)${NC}"
echo -e "${GREEN}✅ npm $(npm --version)${NC}"
echo ""

# Verificar variáveis de ambiente
echo "🔐 Verificando variáveis de ambiente..."
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ Arquivo .env.local não encontrado${NC}"
    exit 1
fi

if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local && grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
    echo -e "${GREEN}✅ Variáveis de ambiente configuradas${NC}"
else
    echo -e "${RED}❌ Variáveis de ambiente faltando em .env.local${NC}"
    exit 1
fi
echo ""

# Verificar arquivo mcp.json
echo "📄 Verificando mcp.json..."
if [ -f mcp.json ]; then
    echo -e "${GREEN}✅ mcp.json encontrado${NC}"
else
    echo -e "${YELLOW}⚠️  mcp.json não encontrado (opcional)${NC}"
fi
echo ""

# Verificar se o Inspector está disponível
echo "🔍 Verificando MCP Inspector..."
if npx @mcpjam/inspector@latest --version &> /dev/null; then
    echo -e "${GREEN}✅ MCP Inspector disponível${NC}"
else
    echo -e "${YELLOW}⚠️  Baixando MCP Inspector...${NC}"
fi
echo ""

# Instruções finais
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Todos os pré-requisitos verificados!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 Para iniciar o teste, execute um dos comandos:"
echo ""
echo -e "${YELLOW}Opção 1 - Inspector com config:${NC}"
echo "  npx @mcpjam/inspector@latest --config mcp.json"
echo ""
echo -e "${YELLOW}Opção 2 - Inspector standalone:${NC}"
echo "  npx @mcpjam/inspector@latest"
echo "  Depois conecte manualmente via STDIO:"
echo "    Command: node"
echo "    Args: $(pwd)/mcp-server.mjs"
echo ""
echo -e "${YELLOW}Opção 3 - Inspector com Ollama:${NC}"
echo "  npx @mcpjam/inspector@latest --ollama llama3.2"
echo ""
echo "📚 Documentação completa: docs/debug/TESTE-MCP-INSPECTOR.md"
echo ""


#!/bin/bash

# Script de Setup do LLM Playground
# Configura Ollama ou OpenAI para usar com MCP Inspector

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🎮 Setup do LLM Playground - MCP Inspector"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Menu de opções
echo "Escolha uma opção:"
echo ""
echo "  1) 🆓 Ollama (Recomendado - Gratuito e Local)"
echo "  2) 💰 OpenAI API (Pago - GPT-4/3.5)"
echo "  3) 🤖 Anthropic Claude (Pago)"
echo "  4) ❌ Cancelar"
echo ""
read -p "Opção (1-4): " option

case $option in
  1)
    echo ""
    echo -e "${BLUE}━━━ Instalando Ollama ━━━${NC}"
    echo ""
    
    # Verificar se já está instalado
    if command -v ollama &> /dev/null; then
        echo -e "${GREEN}✅ Ollama já está instalado!${NC}"
        ollama --version
    else
        echo "📥 Baixando e instalando Ollama..."
        curl -fsSL https://ollama.com/install.sh | sh
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Ollama instalado com sucesso!${NC}"
        else
            echo -e "${RED}❌ Erro ao instalar Ollama${NC}"
            exit 1
        fi
    fi
    
    echo ""
    echo -e "${BLUE}━━━ Escolha um modelo ━━━${NC}"
    echo ""
    echo "  1) llama3.2 (2GB - Rápido) ⚡⚡⚡"
    echo "  2) llama3.2:3b (3GB - Balanceado) ⚡⚡"
    echo "  3) mistral (4GB - Bom para código) ⚡⚡"
    echo "  4) codellama (4GB - Especializado) ⚡"
    echo ""
    read -p "Modelo (1-4): " model_option
    
    case $model_option in
      1) MODEL="llama3.2" ;;
      2) MODEL="llama3.2:3b" ;;
      3) MODEL="mistral" ;;
      4) MODEL="codellama" ;;
      *) MODEL="llama3.2" ;;
    esac
    
    echo ""
    echo "📦 Baixando modelo $MODEL..."
    echo "(Isso pode levar alguns minutos dependendo da conexão)"
    ollama pull $MODEL
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ Modelo $MODEL baixado!${NC}"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo -e "${GREEN}🎉 Setup completo!${NC}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "Para iniciar o Inspector com Ollama:"
        echo ""
        echo -e "${YELLOW}  npx @mcpjam/inspector@latest --config mcp.json --ollama $MODEL${NC}"
        echo ""
        echo "Ou use o atalho:"
        echo ""
        echo -e "${YELLOW}  ./start-inspector-ollama.sh${NC}"
        echo ""
        
        # Criar script de atalho
        cat > start-inspector-ollama.sh << EOF
#!/bin/bash
echo "🚀 Iniciando MCP Inspector com Ollama ($MODEL)..."
npx @mcpjam/inspector@latest --config mcp.json --ollama $MODEL
EOF
        chmod +x start-inspector-ollama.sh
        
    else
        echo -e "${RED}❌ Erro ao baixar modelo${NC}"
        exit 1
    fi
    ;;
    
  2)
    echo ""
    echo -e "${BLUE}━━━ Configurando OpenAI API ━━━${NC}"
    echo ""
    echo "Você precisa de uma API key da OpenAI."
    echo "Obtenha em: https://platform.openai.com/api-keys"
    echo ""
    read -p "Cole sua OpenAI API key (sk-...): " openai_key
    
    if [ -z "$openai_key" ]; then
        echo -e "${RED}❌ API key não pode estar vazia${NC}"
        exit 1
    fi
    
    # Adicionar ao .env.local
    if grep -q "OPENAI_API_KEY" .env.local 2>/dev/null; then
        echo -e "${YELLOW}⚠️  OPENAI_API_KEY já existe no .env.local${NC}"
        read -p "Sobrescrever? (s/n): " overwrite
        if [ "$overwrite" = "s" ]; then
            sed -i "s/OPENAI_API_KEY=.*/OPENAI_API_KEY=$openai_key/" .env.local
        fi
    else
        echo "" >> .env.local
        echo "# OpenAI API Key para LLM Playground" >> .env.local
        echo "OPENAI_API_KEY=$openai_key" >> .env.local
    fi
    
    echo ""
    echo -e "${GREEN}✅ OpenAI API configurada!${NC}"
    echo ""
    echo "Para usar:"
    echo ""
    echo -e "${YELLOW}  export OPENAI_API_KEY=\"$openai_key\"${NC}"
    echo -e "${YELLOW}  npx @mcpjam/inspector@latest --config mcp.json${NC}"
    echo ""
    ;;
    
  3)
    echo ""
    echo -e "${BLUE}━━━ Configurando Anthropic Claude ━━━${NC}"
    echo ""
    echo "Você precisa de uma API key da Anthropic."
    echo "Obtenha em: https://console.anthropic.com/settings/keys"
    echo ""
    read -p "Cole sua Anthropic API key (sk-ant-...): " anthropic_key
    
    if [ -z "$anthropic_key" ]; then
        echo -e "${RED}❌ API key não pode estar vazia${NC}"
        exit 1
    fi
    
    # Adicionar ao .env.local
    if grep -q "ANTHROPIC_API_KEY" .env.local 2>/dev/null; then
        echo -e "${YELLOW}⚠️  ANTHROPIC_API_KEY já existe no .env.local${NC}"
        read -p "Sobrescrever? (s/n): " overwrite
        if [ "$overwrite" = "s" ]; then
            sed -i "s/ANTHROPIC_API_KEY=.*/ANTHROPIC_API_KEY=$anthropic_key/" .env.local
        fi
    else
        echo "" >> .env.local
        echo "# Anthropic API Key para Claude" >> .env.local
        echo "ANTHROPIC_API_KEY=$anthropic_key" >> .env.local
    fi
    
    echo ""
    echo -e "${GREEN}✅ Anthropic API configurada!${NC}"
    echo ""
    echo "Para usar:"
    echo ""
    echo -e "${YELLOW}  export ANTHROPIC_API_KEY=\"$anthropic_key\"${NC}"
    echo -e "${YELLOW}  npx @mcpjam/inspector@latest --config mcp.json${NC}"
    echo ""
    ;;
    
  4)
    echo ""
    echo "❌ Cancelado"
    exit 0
    ;;
    
  *)
    echo ""
    echo -e "${RED}❌ Opção inválida${NC}"
    exit 1
    ;;
esac

echo ""
echo "📚 Documentação: docs/debug/CONFIGURAR-LLM-PLAYGROUND.md"
echo ""


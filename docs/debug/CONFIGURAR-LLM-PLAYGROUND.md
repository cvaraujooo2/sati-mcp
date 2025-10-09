# 🎮 Configurar LLM Playground no MCP Inspector

Guia para usar o playground com seu servidor MCP

---

## 🎯 O Problema

Você adicionou a API key da OpenAI no Inspector, mas o playground não funciona ou pede para criar conta.

**Causa**: O MCP Inspector tem limitações com algumas integrações de LLM.

---

## ✅ Soluções Disponíveis

### 🆓 Opção 1: Ollama (Recomendado - Gratuito e Local)

**Vantagens**:
- ✅ Totalmente gratuito
- ✅ Roda localmente (privacidade)
- ✅ Não precisa de API key
- ✅ Funciona offline

**Instalação**:

#### Ubuntu/Debian (seu caso)

```bash
# Instalar Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Verificar instalação
ollama --version

# Baixar modelo (escolha um):
ollama pull llama3.2          # 2GB - Rápido
ollama pull llama3.2:3b       # 3GB - Balanceado
ollama pull mistral           # 4GB - Bom para código
ollama pull codellama         # 4GB - Especializado em código

# Testar
ollama run llama3.2
```

#### Iniciar Inspector com Ollama

```bash
# Parar Inspector atual se estiver rodando
lsof -ti:3000 | xargs kill -9 2>/dev/null

# Iniciar com Ollama
npx @mcpjam/inspector@latest --config mcp.json --ollama llama3.2
```

Agora o playground funcionará automaticamente! 🎉

---

### 💰 Opção 2: OpenAI API (Paga)

Se você tem créditos na OpenAI e quer usar GPT-4/GPT-3.5:

#### Passo 1: Obter API Key

1. Acesse: https://platform.openai.com/api-keys
2. Clique em **"Create new secret key"**
3. Copie a chave (começa com `sk-...`)

#### Passo 2: Adicionar ao .env.local

```bash
echo "" >> .env.local
echo "# OpenAI API Key para LLM Playground" >> .env.local
echo "OPENAI_API_KEY=sk-sua-chave-aqui" >> .env.local
```

#### Passo 3: Configurar no Inspector

O Inspector pode não ler automaticamente do `.env.local`. Você tem duas opções:

**Opção A: Via Interface**
1. Abra o Inspector
2. Vá em **Settings** (ícone de engrenagem)
3. Cole sua API key no campo **OpenAI API Key**
4. Salve

**Opção B: Via Variável de Ambiente**
```bash
export OPENAI_API_KEY="sk-sua-chave-aqui"
npx @mcpjam/inspector@latest --config mcp.json
```

---

### 🤖 Opção 3: Anthropic Claude (Paga)

Se você prefere Claude:

#### Passo 1: Obter API Key

1. Acesse: https://console.anthropic.com/settings/keys
2. Crie uma nova API key
3. Copie a chave

#### Passo 2: Adicionar ao .env.local

```bash
echo "" >> .env.local
echo "# Anthropic API Key para Claude" >> .env.local
echo "ANTHROPIC_API_KEY=sk-ant-sua-chave-aqui" >> .env.local
```

#### Passo 3: Iniciar Inspector

```bash
export ANTHROPIC_API_KEY="sk-ant-sua-chave-aqui"
npx @mcpjam/inspector@latest --config mcp.json
```

---

## 🧪 Testar o Playground

### 1. Verificar Conexão

Após iniciar o Inspector:

1. Abra: http://localhost:3000
2. Verifique se o servidor "sati" está **Connected** (verde)
3. Clique na aba **"LLM Playground"**

### 2. Teste Simples

Digite no chat:

```
Olá! Você está conectado ao servidor MCP do Sati?
```

O LLM deve responder e ter acesso às suas 10 tools.

### 3. Teste com Tool

```
Crie um hyperfocus chamado "Testar MCP Inspector" com cor azul e 30 minutos estimados
```

O LLM deve:
1. Chamar a tool `createHyperfocus`
2. Retornar o resultado estruturado
3. Mostrar o componente visual

---

## 🎯 Recomendação: Ollama

Para desenvolvimento e testes, **recomendo fortemente usar Ollama**:

### Por quê?

1. **Gratuito**: Sem custos de API
2. **Rápido**: Roda localmente
3. **Privado**: Seus dados não saem da máquina
4. **Offline**: Funciona sem internet

### Modelos Recomendados

| Modelo | Tamanho | Uso | Velocidade |
|--------|---------|-----|------------|
| `llama3.2` | 2GB | Geral | ⚡⚡⚡ |
| `llama3.2:3b` | 3GB | Balanceado | ⚡⚡ |
| `mistral` | 4GB | Código | ⚡⚡ |
| `codellama` | 4GB | Código especializado | ⚡ |

### Instalação Rápida

```bash
# Instalar
curl -fsSL https://ollama.com/install.sh | sh

# Baixar modelo
ollama pull llama3.2

# Testar
ollama run llama3.2
# Digite: "Olá, você funciona?"
# Ctrl+D para sair

# Usar com Inspector
npx @mcpjam/inspector@latest --config mcp.json --ollama llama3.2
```

---

## 🐛 Troubleshooting

### Erro: "Ollama not found"

**Solução**:
```bash
# Verificar se Ollama está no PATH
which ollama

# Se não estiver, adicionar ao PATH
echo 'export PATH=$PATH:/usr/local/bin' >> ~/.bashrc
source ~/.bashrc
```

### Erro: "Model not found"

**Solução**:
```bash
# Listar modelos instalados
ollama list

# Se vazio, baixar modelo
ollama pull llama3.2
```

### Erro: "OpenAI API key invalid"

**Causas possíveis**:
1. Chave copiada incorretamente (espaços extras)
2. Chave revogada
3. Sem créditos na conta OpenAI

**Solução**:
```bash
# Testar chave manualmente
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Deve retornar lista de modelos
```

### Playground não aparece

**Solução**:
1. Limpar cache do navegador (Ctrl+Shift+Delete)
2. Reiniciar Inspector
3. Tentar em aba anônima

---

## 📊 Comparação de Opções

| Opção | Custo | Velocidade | Qualidade | Privacidade | Offline |
|-------|-------|------------|-----------|-------------|---------|
| **Ollama** | 🆓 Grátis | ⚡ Rápido | ⭐⭐⭐ | ✅ Alta | ✅ Sim |
| **OpenAI** | 💰 Pago | ⚡⚡⚡ Muito rápido | ⭐⭐⭐⭐⭐ | ❌ Baixa | ❌ Não |
| **Claude** | 💰 Pago | ⚡⚡ Rápido | ⭐⭐⭐⭐⭐ | ❌ Baixa | ❌ Não |

---

## 🚀 Script de Setup Completo

```bash
#!/bin/bash

# Setup completo do LLM Playground

echo "🎮 Configurando LLM Playground..."

# Opção 1: Ollama (recomendado)
read -p "Instalar Ollama? (s/n): " install_ollama
if [ "$install_ollama" = "s" ]; then
    echo "📥 Instalando Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
    
    echo "📦 Baixando modelo llama3.2..."
    ollama pull llama3.2
    
    echo "✅ Ollama instalado!"
    echo ""
    echo "Para usar:"
    echo "  npx @mcpjam/inspector@latest --config mcp.json --ollama llama3.2"
fi

# Opção 2: OpenAI
read -p "Configurar OpenAI API? (s/n): " setup_openai
if [ "$setup_openai" = "s" ]; then
    read -p "Cole sua OpenAI API key: " openai_key
    echo "" >> .env.local
    echo "OPENAI_API_KEY=$openai_key" >> .env.local
    echo "✅ OpenAI configurada!"
fi

echo ""
echo "🎉 Setup completo!"
```

Salve como `setup-playground.sh` e execute:
```bash
chmod +x setup-playground.sh
./setup-playground.sh
```

---

## 📚 Recursos

- [Ollama](https://ollama.com) - Site oficial
- [Ollama Models](https://ollama.com/library) - Catálogo de modelos
- [OpenAI API](https://platform.openai.com) - Dashboard
- [Anthropic Console](https://console.anthropic.com) - Claude API

---

## 🎯 Resumo Rápido

```bash
# Solução mais rápida: Ollama
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.2
npx @mcpjam/inspector@latest --config mcp.json --ollama llama3.2

# Abrir: http://localhost:3000
# Ir para: LLM Playground
# Testar: "Crie um hyperfocus chamado Teste"
```

---

**Última atualização**: 2025-10-09  
**Recomendação**: Use Ollama para desenvolvimento! 🚀


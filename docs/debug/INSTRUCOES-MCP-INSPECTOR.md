# 🎯 INSTRUÇÕES EXATAS - MCP Inspector

## ✅ SOLUÇÃO: Preencher Campos Separados

O MCP Inspector precisa que você separe o comando dos argumentos!

---

## 📋 O QUE FAZER NO MCP INSPECTOR:

### **Opção 1: Usando Script (MAIS FÁCIL)** ⭐

```
┌─────────────────────────────────────────────────────┐
│ Transport Type:                                     │
│   [Dropdown] → STDIO                                │
│                                                     │
│ Connection Type:                                    │
│   ● Server Entry                                    │
│                                                     │
│ Command:                                            │
│   /home/ester/Documentos/docs/sati-mcp/run-mcp.sh  │
│                                                     │
│ Args: (deixar vazio)                                │
│                                                     │
│ [Connect] ← Click aqui                              │
└─────────────────────────────────────────────────────┘
```

### **Opção 2: Usando Node Diretamente**

```
┌─────────────────────────────────────────────────────┐
│ Transport Type:                                     │
│   [Dropdown] → STDIO                                │
│                                                     │
│ Connection Type:                                    │
│   ● Server Entry                                    │
│                                                     │
│ Command:                                            │
│   /usr/bin/node                                     │
│                                                     │
│ Args:                                               │
│   /home/ester/Documentos/docs/sati-mcp/mcp-server.js│
│                                                     │
│ [Connect] ← Click aqui                              │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 PASSO A PASSO VISUAL

### 1. No MCP Inspector, procure por:

```
Transport Type: [Dropdown ▼]
```

**Click no dropdown e selecione:** `STDIO`

---

### 2. Você verá aparecer novos campos:

```
Connection Type:
  ○ Via Proxy
  ● Server Entry  ← Marque este!
```

---

### 3. Preencha os campos:

#### **Campo "Command":**
Digite EXATAMENTE (copie e cole):
```
/home/ester/Documentos/docs/sati-mcp/run-mcp.sh
```

#### **Campo "Args":**
Deixe **VAZIO** (não digite nada)

---

### 4. Click no botão verde:
```
[Connect]
```

---

## ✅ SUCESSO: O Que Você Deve Ver

### Após clicar em Connect:

```
┌─────────────────────────────────────────────────────┐
│ Status: ● Connected                   (verde)       │
│                                                     │
│ Console output:                                     │
│ Sati MCP Server running on stdio                    │
└─────────────────────────────────────────────────────┘
```

### Botões habilitados:
```
[List Tools]  [List Resources]  [List Prompts]
```

---

## 🧪 TESTAR AS TOOLS

### 1. Click em: `[List Tools]`

**Resposta esperada no painel "Tools":**
```
✅ createHyperfocus
   Creates a new hyperfocus area to help neurodivergent users...
```

---

### 2. Click na tool `createHyperfocus`

Você verá um editor JSON aparecer:

---

### 3. No editor JSON, digite:

```json
{
  "title": "Meu Primeiro Hiperfoco"
}
```

Ou o exemplo completo:

```json
{
  "title": "Aprender Next.js",
  "description": "Focar em App Router",
  "color": "blue",
  "estimatedTimeMinutes": 120
}
```

---

### 4. Click em: `[Call Tool]`

---

### 5. Veja a resposta:

```
✅ Hiperfoco criado com sucesso!

ID: hf-1728512345678
Título: Aprender Next.js
Descrição: Focar em App Router
Cor: blue
Tempo estimado: 120 minutos

Total de hiperfocos: 1
```

---

## ❌ SE DER ERRO "ENOENT"

### Erro:
```
Error: spawn node mcp-server.js ENOENT
```

### Causa:
Você digitou no campo "Command":
```
❌ node mcp-server.js  (ERRADO - tudo junto)
```

### Solução:
Separe em dois campos:

**Command:**
```
/usr/bin/node
```

**Args:**
```
/home/ester/Documentos/docs/sati-mcp/mcp-server.js
```

**OU use o script:**

**Command:**
```
/home/ester/Documentos/docs/sati-mcp/run-mcp.sh
```

**Args:** (vazio)

---

## ❌ SE DER ERRO "Permission Denied"

### Erro:
```
Error: spawn EACCES
```

### Solução:
```bash
# No terminal:
chmod +x /home/ester/Documentos/docs/sati-mcp/run-mcp.sh
chmod +x /home/ester/Documentos/docs/sati-mcp/mcp-server.js
```

---

## 📸 SCREENSHOT DOS CAMPOS (texto)

```
┌─────────────────────────────────────────────────────┐
│ MCP Inspector v0.17.0                               │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Transport Type                                      │
│ ┌─────────────────────────────────────────────┐   │
│ │ STDIO                                    ▼  │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ Connection Type                                     │
│ ● Server Entry    ○ Via Proxy                      │
│                                                     │
│ Command                                             │
│ ┌─────────────────────────────────────────────┐   │
│ │ /home/ester/Documentos/docs/sati-mcp/       │   │
│ │ run-mcp.sh                                   │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ Args (optional)                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │                                              │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│                    [Connect]                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 CHECKLIST RÁPIDO

- [ ] 1. Transport Type = `STDIO`
- [ ] 2. Connection Type = `Server Entry` (marcado)
- [ ] 3. Command = `/home/ester/Documentos/docs/sati-mcp/run-mcp.sh`
- [ ] 4. Args = (vazio)
- [ ] 5. Click `[Connect]`
- [ ] 6. Status = Connected ✅
- [ ] 7. Click `[List Tools]`
- [ ] 8. Ver `createHyperfocus` ✅
- [ ] 9. Preencher `{"title": "Teste"}`
- [ ] 10. Click `[Call Tool]`
- [ ] 11. Ver mensagem de sucesso ✅

---

## 🚀 TUDO PRONTO!

**Comando para copiar e colar:**

```
/home/ester/Documentos/docs/sati-mcp/run-mcp.sh
```

Cole isso no campo **"Command"** e deixe **"Args"** vazio!

---

## 🆘 AINDA COM PROBLEMAS?

### Teste no terminal primeiro:

```bash
# Ir para pasta do projeto:
cd /home/ester/Documentos/docs/sati-mcp

# Testar o script:
./run-mcp.sh

# Deve aparecer:
# Sati MCP Server running on stdio

# Depois, testar enviando um comando MCP:
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | ./run-mcp.sh
```

Se funcionar no terminal, funcionará no Inspector! ✅

---

**Boa sorte! 🎉**


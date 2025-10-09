# 📊 Resumo Executivo - MCP Sati

## O Que é Sati?

**Sati** é um aplicativo para ChatGPT que ajuda pessoas neurodivergentes a organizar hiperfocos e transformar conversas caóticas em ação estruturada.

---

## 🎯 Por Que Construir Isto?

### Problema Real
- **30 milhões+** de pessoas com TDAH só nos EUA
- **70%** relatam dificuldade em organizar múltiplos interesses
- Ferramentas existentes (Notion, Todoist) são **muito complexas** ou **não entendem hiperfoco**

### Nossa Solução
Sati vive **onde neurodivergentes já estão** (ChatGPT) e automaticamente:
1. 🔍 Detecta quando você menciona múltiplos interesses
2. ✨ Estrutura cada um em projeto acionável
3. 📝 Quebra em subtarefas gerenciáveis
4. ⏰ Oferece timer de foco respeitoso
5. 🔄 Gerencia alternância entre hiperfocos

---

## 💡 Diferencial Competitivo

| Característica | Notion | Todoist | Forest | **Sati** |
|----------------|--------|---------|--------|----------|
| Integrado ao ChatGPT | ❌ | ❌ | ❌ | ✅ |
| Detecta hiperfocos automaticamente | ❌ | ❌ | ❌ | ✅ |
| Zero setup | ❌ | ❌ | ✅ | ✅ |
| Timer + Organização | ❌ | ❌ | Parcial | ✅ |
| Feito para neurodivergentes | ❌ | ❌ | ❌ | ✅ |

**Único app que combina:** Detecção inteligente + Estruturação + Timer + Alternância

---

## 🏗️ Stack Tecnológica

**Frontend:** React + TypeScript + Tailwind CSS  
**Backend:** Next.js 14 (App Router)  
**Database:** Supabase (PostgreSQL + Auth + Realtime)  
**Hosting:** Vercel  
**Protocol:** Model Context Protocol (MCP)  

**Por quê essa stack?**
- ✅ Supabase: Auth OAuth pronto + Realtime + generous free tier
- ✅ Next.js: MCP server + componentes no mesmo repo
- ✅ Vercel: Deploy automático, HTTPS grátis, Edge Network
- ✅ TypeScript: Type safety essencial para MCP schemas

---

## 📅 Timeline

**10 Sprints = 20 Semanas (5 Meses)**

```
Mês 1: [████████░░] Setup + Auth
Mês 2: [██████████] Core Tools  
Mês 3: [██████████] UI Components
Mês 4: [██████████] Timer + Alternância
Mês 5: [██████████] Testes + Beta + Launch
```

### Milestones
- ✅ **Milestone 1** (Sem 8): Basic MCP Working
- ✅ **Milestone 2** (Sem 16): Full MVP Complete  
- ✅ **Milestone 3** (Sem 20): Production Ready

---

## 💰 Investimento Necessário

### Custos de Desenvolvimento (5 meses)

| Item | Custo Mensal | Total 5 Meses |
|------|--------------|---------------|
| Supabase (Free tier) | $0 | $0 |
| Vercel (Hobby) | $0 | $0 |
| Domínio (.app) | - | $15 |
| Ferramentas dev | $0 | $0 |
| **Total** | **$0/mês** | **~$15** |

**Investimento Real:** Seu tempo (100-150 horas totais)

### Custos Pós-Launch (após beta)

| Item | Custo Mensal |
|------|--------------|
| Supabase Pro (>100 usuários) | $25 |
| Vercel Pro (custom domain + analytics) | $20 |
| Sentry (error tracking) | $0 (free tier) |
| Email (support@sati.app) | $6 |
| **Total** | **~$51/mês** |

**Break-even:** ~10 usuários pagantes ($4.99/mês) se monetizar

---

## 📊 Métricas de Sucesso

### Curto Prazo (3 meses)
- 🎯 **100+ instalações** do app
- 🎯 **1,000+ hiperfocos** criados
- 🎯 **60% retention** semanal
- 🎯 **NPS >40**

### Médio Prazo (6 meses)
- 🎯 **500+ usuários ativos mensais**
- 🎯 **Top 10** em categoria Productivity no diretório ChatGPT
- 🎯 **Partnership** com organização de ADHD
- 🎯 **NPS >50**

### Longo Prazo (1 ano)
- 🎯 **2,000+ usuários ativos**
- 🎯 **$2,000+ MRR** (se monetizar)
- 🎯 **Menções em artigos** sobre neurodivergência
- 🎯 **Ecosystem** de apps complementares

---

## ⚡ Quick Wins (Primeiras 2 Semanas)

Você pode validar a ideia RAPIDAMENTE com:

### Semana 1: Protótipo
- [ ] Setup Next.js básico
- [ ] MCP endpoint que responde "Hello World"
- [ ] Conectar no ChatGPT developer mode
- [ ] ✨ **Win:** Ver primeira resposta de Sati no ChatGPT

### Semana 2: Tool Mockada
- [ ] Tool `createHyperfocus` com dados mockados (sem DB)
- [ ] Retornar structured content hardcoded
- [ ] Validar que ChatGPT entende o formato
- [ ] ✨ **Win:** Criar hiperfoco via ChatGPT (mesmo sem persistir)

**Validação:** Se em 2 semanas você consegue criar um hiperfoco via ChatGPT, o resto é "apenas" engenharia! 🚀

---

## 🎯 North Star Metric

**"Número de hiperfocos organizados por usuários neurodivergentes"**

Por quê?
- Mede valor real entregue (organizing chaos)
- Correlaciona com engagement
- Proxy para qualidade de vida melhorada
- Fácil de medir e comunicar

---

## 🧠 Decisões de Design Críticas

### 1. Por que MCP e não Chrome Extension?
- ✅ Usuários já usam ChatGPT (distribution gratuita)
- ✅ Funciona em mobile também
- ✅ Menos código (não precisa de popup/background script)
- ✅ OAuth + storage mais simples

### 2. Por que Supabase e não Firebase?
- ✅ PostgreSQL (mais poderoso que Firestore)
- ✅ Realtime nativo
- ✅ RLS policies (segurança granular)
- ✅ Open source (pode self-host)

### 3. Por que Next.js e não Express?
- ✅ API routes + componentes no mesmo repo
- ✅ TypeScript first-class
- ✅ Vercel optimization nativa
- ✅ SSR para SEO (landing page)

### 4. Por que não usar AI para sugerir tarefas?
- ⚠️ **MVP:** Usuário sugere tarefas via ChatGPT, Sati apenas persiste
- ✅ **Futuro:** Sati pode usar LLM para sugestões inteligentes
- 🎯 **Razão:** Simplificar MVP, validar core value first

---

## 🌟 Mensagem de Motivação

> "Neurodivergentes não precisam de mais ferramentas complicadas.
> Precisam de sistemas que entendam como seus cérebros funcionam.
> 
> Sati não tenta 'consertar' hiperfoco.
> Sati abraça hiperfoco e o torna superpoder organizável."

---

## 📚 Recursos Adicionais

### Documentação
- 📄 [PRD Completo](./PRD-MCP-SATI.md) - 15 páginas detalhadas
- 📄 [Plano de Sprints](./PLANO-SPRINTS.md) - 10 sprints detalhados
- 📄 [Este Resumo](./RESUMO-EXECUTIVO.md) - Você está aqui!

### Links Úteis
- [ChatGPT Apps SDK Docs](https://developers.openai.com/apps-sdk)
- [Model Context Protocol Spec](https://modelcontextprotocol.io)
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)

### Comunidade
- [r/ADHD](https://reddit.com/r/adhd) - 1.5M+ membros
- [r/neurodivergent](https://reddit.com/r/neurodivergent) - 100K+ membros
- [How to ADHD (YouTube)](https://youtube.com/@HowtoADHD) - Influencer parceiro potencial

---

## 🎬 Próxima Ação

**Escolha uma:**

### Opção A: Começar Agora (Recomendado)
```bash
# 1. Clonar template Next.js
npx create-next-app@latest sati-mcp --typescript --tailwind --app

# 2. Instalar deps MCP
cd sati-mcp
npm install @modelcontextprotocol/sdk zod

# 3. Criar primeiro endpoint
# app/mcp/route.ts (ver Sprint 1 tasks)

# 4. Testar com MCP Inspector
npx @modelcontextprotocol/inspector@latest
```

### Opção B: Planejar Mais
- Recrutar co-founder técnico
- Buscar grant/funding
- Validar com mais pesquisa de usuário

### Opção C: Fazer Protótipo Super Rápido (3 dias)
- Hardcode tudo
- Sem banco de dados
- Apenas provar que funciona
- Decidir depois se vale investir 5 meses

---

**Recomendação:** Opção A (começar) ou Opção C (protótipo)

Neurodivergentes precisam de Sati. Vamos construir! 💪

---

*Criado com 🧠 por pessoa neurodivergente, para pessoas neurodivergentes.*


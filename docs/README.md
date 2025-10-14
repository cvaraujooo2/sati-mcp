# 🎯 Sati - MCP para Hiperfocos Neurodivergentes

> **Transforme conversas caóticas em ação estruturada**  
> Aplicativo ChatGPT feito para pessoas neurodivergentes organizarem seus hiperfocos

---

## 🌟 O Que é Sati?

Sati é um **MCP (Model Context Protocol) app** que vive dentro do ChatGPT e ajuda pessoas com TDAH, autismo e outras neurodivergências a:

- 🔍 **Detectar** automaticamente quando você menciona múltiplos interesses
- ✨ **Estruturar** cada hiperfoco em projeto acionável
- 📝 **Decompor** em subtarefas gerenciáveis (sem sobrecarga)
- ⏰ **Timer de foco** respeitoso (sem interrupções abruptas)
- 🔄 **Alternar** entre hiperfocos minimizando impacto cognitivo

---

## 📚 Documentação

### 🆕 **NOVO: Guias de Integração Componentes + Supabase**

**Para desenvolvedores implementando hooks e persistência direta:**

| Documento | Tipo | Tempo | Descrição |
|-----------|------|-------|-----------|
| [**📖 Índice Mestre**](./INTEGRACAO-COMPONENTES-SUPABASE-INDEX.md) | 🎯 START HERE | 10 min | Visão geral e links para todos os guias |
| [**📘 Guia Completo**](./GUIA-IMPLEMENTACAO-INTEGRACAO-COMPONENTES.md) | Tutorial | 30-40 min | Implementação passo a passo com código completo |
| [**✅ Checklist Rápida**](./CHECKLIST-IMPLEMENTACAO-RAPIDA.md) | Referência | Durante dev | Templates prontos e validações |
| [**📊 Diagramas**](./DIAGRAMAS-FLUXOS.md) | Visual | 15 min | Arquitetura e fluxos ilustrados |
| [**🔧 Troubleshooting**](./TROUBLESHOOTING.md) | Suporte | Quando necessário | Soluções para problemas comuns |

**💡 Dica:** Se você é júnior, comece pelo Índice Mestre. Se é pleno/sênior, vá direto para a Checklist.

---

### 📄 Documentos Principais

| Documento | Descrição | Páginas |
|-----------|-----------|---------|
| [**PRD Completo**](./PRD-MCP-SATI.md) | Product Requirements Document detalhado | 15 |
| [**Plano de Sprints**](./PLANO-SPRINTS.md) | 10 sprints (20 semanas) com tasks | 12 |
| [**Tech Stack**](./TECH-STACK.md) | Arquitetura técnica completa | 10 |
| [**Código Exemplo**](./CODIGO-EXEMPLO.md) | Código pronto para começar | 8 |
| [**Golden Prompts**](./GOLDEN-PROMPTS.md) | Prompts de teste para discovery | 5 |
| [**Resumo Executivo**](./RESUMO-EXECUTIVO.md) | TL;DR do projeto | 3 |

### 🎯 Por Onde Começar?

**Se você é:**

- **Product Manager** → Leia [Resumo Executivo](./RESUMO-EXECUTIVO.md)
- **Developer** → Leia [Tech Stack](./TECH-STACK.md) + [Código Exemplo](./CODIGO-EXEMPLO.md)
- **Designer** → Leia [PRD - Seção de Componentes](./PRD-MCP-SATI.md#componentes-ui)
- **Investidor** → Leia [Resumo Executivo - Métricas](./RESUMO-EXECUTIVO.md#-métricas-de-sucesso)
- **Beta Tester** → Aguarde Sprint 10! (ou candidate-se já)

---

## 🏗️ Stack Tecnológica (TL;DR)

```
Frontend:  React 18 + TypeScript + Tailwind CSS
Backend:   Next.js 14 (App Router)
Database:  Supabase (PostgreSQL + Auth + Realtime)
Hosting:   Vercel
Protocol:  Model Context Protocol (MCP)

Custo inicial: ~$15 (domínio)
Custo mensal:  ~$51 (após 100+ usuários)
```

---

## 🚀 Quick Start (3 Passos)

### 1. Clone e Install

```bash
git clone <seu-repo>
cd sati-mcp
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
# Preencha com suas credenciais Supabase e OAuth
```

### 3. Run

```bash
npm run dev
# App: http://localhost:3000
# MCP: http://localhost:3000/mcp
```

### 4. Test com MCP Inspector

```bash
# Configurar mcp.json (já incluído no projeto)
# Copiar template e preencher credenciais
cp mcp.json.example mcp.json

# Iniciar Inspector
npx @mcpjam/inspector@latest --config mcp.json

# Abrir navegador em: http://localhost:3000
# Verificar se servidor "sati" está conectado (verde)
# Testar tool: createHyperfocus
```

**📚 Guias de Teste:**
- [Quick Start Inspector](../QUICK-START-INSPECTOR.md) - Início rápido (3 minutos)
- [Guia Completo](./debug/TESTE-MCP-INSPECTOR.md) - Documentação detalhada
- [Status Atual](../STATUS-INSPECTOR.md) - Comandos e troubleshooting

---

## 📅 Timeline

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Sprint 1-2:  ████░░░░░░  Setup + Auth            │
│  Sprint 3-4:  ██████░░░░  Core Tools               │
│  Sprint 5-6:  ████████░░  UI Components            │
│  Sprint 7-8:  ██████████  Timer + Alternância      │
│  Sprint 9:    ██████████  Testes & Polish          │
│  Sprint 10:   ██████████  Beta & Launch            │
│                                                     │
│  Total: 20 semanas (5 meses)                       │
└─────────────────────────────────────────────────────┘

Milestone 1: Sem 8  - Basic MCP Working
Milestone 2: Sem 16 - Full MVP Complete
Milestone 3: Sem 20 - Production Ready
```

---

## 🎯 Features (MVP)

### ✅ Core Features

- [x] **Análise de Contexto** - Detecta múltiplos interesses automaticamente
- [x] **Criar Hiperfoco** - Estrutura interesse em projeto
- [x] **Decompor em Tarefas** - Quebra projeto em 3-8 subtarefas
- [x] **Timer de Foco** - 5-120min com alarme gentil
- [x] **Lista de Hiperfocos** - Visualização em árvore
- [x] **Marcar Tarefas** - Check/uncheck com progresso visual
- [x] **Sistema de Alternância** - Gerencia transições entre hiperfocos

### 📋 Componentes UI

- [x] **HyperfocusCard** (inline) - Card de hiperfoco criado
- [x] **TaskBreakdown** (inline) - Lista de tarefas com progresso
- [x] **HyperfocusTreeView** (inline) - Árvore de todos hiperfocos
- [x] **FocusTimer** (fullscreen) - Modal com timer circular
- [x] **AlternancyFlow** (inline) - Timeline de alternância

---

## 🧪 Testing

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests (requer ChatGPT developer mode)
npm run test:e2e

# Cobertura
npm run test:coverage
```

**Target:** >70% coverage

---

## 🚀 Deploy

### Development
```bash
git push origin develop
# Auto-deploy to Vercel (preview)
# URL: https://sati-mcp-git-develop.vercel.app
```

### Production
```bash
git checkout main
git merge develop
git push origin main
# Auto-deploy to production
# URL: https://sati.app
```

### Manual
```bash
vercel --prod
```

---

## 📊 Métricas de Sucesso

### 3 Meses Pós-Launch

| Métrica | Target | Atual |
|---------|--------|-------|
| Instalações | 100+ | - |
| Usuários Ativos Mensais | 50+ | - |
| Hiperfocos Criados | 1,000+ | - |
| Retention (7 dias) | 60% | - |
| NPS | >40 | - |

### 6 Meses

| Métrica | Target | Atual |
|---------|--------|-------|
| Usuários Ativos | 500+ | - |
| Rating ChatGPT Store | 4.5+ | - |
| Menções em Social Media | 50+ | - |
| MRR (se monetizar) | $500+ | - |

---

## 🤝 Como Contribuir

### Reportar Bug
1. Ir para [Issues](https://github.com/seu-user/sati-mcp/issues)
2. Click "New Issue" → "Bug Report"
3. Preencher template

### Sugerir Feature
1. Ir para [Discussions](https://github.com/seu-user/sati-mcp/discussions)
2. Categoria: "Ideas"
3. Descrever use case

### Contribuir Código
1. Fork o repositório
2. Criar branch: `feature/minha-feature`
3. Commit: `git commit -m 'Add: nova feature'`
4. Push: `git push origin feature/minha-feature`
5. Abrir Pull Request

**Guidelines:** Ver [CONTRIBUTING.md](./CONTRIBUTING.md) (criar depois)

---

## 👥 Comunidade

- **Discord:** [discord.gg/sati](https://discord.gg/sati) (criar)
- **Twitter:** [@SatiApp](https://twitter.com/SatiApp) (criar)
- **Reddit:** r/SatiApp (considerar)
- **Email:** support@sati.app

---

## 📜 Licença

**MIT License** (ou escolher outra)

```
Copyright (c) 2025 Sati

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

---

## 🙏 Agradecimentos

- **OpenAI** - por criar o Apps SDK e MCP
- **Supabase** - por tooling incrível para devs
- **Comunidade neurodivergente** - por inspiração e feedback
- **How to ADHD (Jessica McCabe)** - por educar sobre TDAH
- **Todos os beta testers** - por acreditar na visão

---

## 🔗 Links Úteis

### Produto
- 🌐 [Landing Page](https://sati.app) (criar)
- 📱 [ChatGPT App Store](https://chatgpt.com/apps/sati) (após aprovação)
- 📺 [Demo Video](https://youtube.com/watch?v=...) (criar)

### Desenvolvimento
- 📖 [MCP Specification](https://modelcontextprotocol.io)
- 📖 [ChatGPT Apps SDK](https://developers.openai.com/apps-sdk)
- 📖 [Next.js Docs](https://nextjs.org/docs)
- 📖 [Supabase Docs](https://supabase.com/docs)

### Comunidade Neurodivergente
- [r/ADHD](https://reddit.com/r/adhd) - 1.5M+ membros
- [r/AutisticPride](https://reddit.com/r/AutisticPride)
- [How to ADHD](https://youtube.com/@HowtoADHD)
- [CHADD](https://chadd.org) - Organização TDAH

---

## 🎨 Screenshots

### Análise de Contexto
![Analysis](./docs/screenshots/analysis.png)

### Hiperfoco Criado
![Hyperfocus Card](./docs/screenshots/hyperfocus-card.png)

### Timer de Foco
![Focus Timer](./docs/screenshots/timer.png)

### Árvore de Hiperfocos
![Tree View](./docs/screenshots/tree-view.png)

*(Screenshots serão adicionados durante desenvolvimento)*

---

## ❓ FAQ

### Por que "Sati"?

**Sati** vem do budismo e significa "atenção plena" ou "mindfulness". Escolhemos porque:
- Curto e memorável
- Internacional (fácil pronunciar em várias línguas)
- Representa o conceito de estar presente no momento

### Sati substitui meu app de tarefas?

Não! Sati **complementa** ferramentas como Notion/Todoist ao:
- Capturar hiperfocos rapidamente no ChatGPT
- Estruturar inicialmente seus interesses
- Depois você pode mover para ferramenta mais robusta

Pense em Sati como "organizador de intenção" vs "gestor de execução".

### Funciona offline?

**Parcialmente:**
- ✅ Componentes renderizam (dados em cache)
- ❌ Criar/editar hiperfocos requer conexão
- 🔄 Sync automático quando voltar online (via Supabase Realtime)

### É grátis?

**MVP:** Sim, 100% gratuito

**Futuro:** Freemium model
- Free: Até 3 hiperfocos ativos
- Pro ($4.99/mês): Ilimitado + features avançadas

### Meus dados ficam privados?

**Sim!** Garantias:
- ✅ Row Level Security (só você vê seus dados)
- ✅ Criptografia em repouso (Supabase)
- ✅ HTTPS obrigatório
- ✅ Não coletamos histórico de chat
- ✅ Você pode deletar tudo a qualquer momento

Ver [Privacy Policy](./PRIVACY.md) (criar)

### Como funciona a integração com ChatGPT?

1. Você instala Sati no ChatGPT (via diretório)
2. Conversa normalmente com ChatGPT
3. Quando menciona múltiplos interesses → ChatGPT automaticamente chama Sati
4. Sati estrutura em hiperfocos e mostra componente visual
5. Tudo persiste no seu Supabase (vinculado via OAuth)

Você também pode chamar diretamente: "Sati, organize isso"

---

## 🎯 Status do Projeto

**Current Sprint:** Sprint 0 (Planejamento) ✅  
**Next Sprint:** Sprint 1 (Setup) - Inicia em: TBD  
**MVP Target:** 20 semanas  
**Public Launch:** Q2 2026 (estimado)  

---

## 🌍 Roadmap Público

### ✅ Q4 2025 (Agora)
- [x] PRD criado
- [x] Plano de sprints definido
- [x] Tech stack escolhida
- [ ] Repositório inicializado
- [ ] Primeiras linhas de código

### 🚧 Q1 2026
- [ ] MVP completo (Sprint 1-8)
- [ ] Beta privado (10-20 usuários)
- [ ] Testes e iteração
- [ ] Submissão ao ChatGPT

### 🎯 Q2 2026
- [ ] Launch público
- [ ] 100+ usuários
- [ ] Feedback e iteração
- [ ] Features avançadas

### 🚀 Q3-Q4 2026
- [ ] 500+ usuários ativos
- [ ] Integrações (Calendar, Notion)
- [ ] Modo colaborativo
- [ ] Consideração de monetização

---

## 💪 Call to Action

### 🧑‍💻 Para Desenvolvedores

**Quer contribuir?**
1. Leia [CONTRIBUTING.md](./CONTRIBUTING.md)
2. Escolha uma issue "good first issue"
3. Abra um PR!

### 🧪 Para Beta Testers

**Quer testar cedo?**
1. Preencha: [forms.gle/sati-beta](https://forms.gle/...) (criar)
2. Receberá acesso em Sprint 10 (Semana 19-20)
3. Ajude a moldar o produto!

### 🎨 Para Designers

**Quer ajudar com UI/UX?**
- Contato: design@sati.app
- Precisamos de: ícones, ilustrações, animations

### 💰 Para Investidores

**Quer conversar sobre funding?**
- Pitch deck: [Ver aqui](./docs/pitch-deck.pdf) (criar)
- Contato: founder@sati.app

---

## 🏆 Créditos

**Criado por:** Ester (neurodivergente, para neurodivergentes)  
**Inspirado por:** Comunidades ADHD/Autismo que lutam com organização  
**Construído com:** ☕ + 💜 + muitos hiperfocos  

---

## 📞 Contato

- **Email:** hello@sati.app
- **Twitter:** [@SatiApp](https://twitter.com/SatiApp)
- **Discord:** [discord.gg/sati](https://discord.gg/sati)
- **GitHub:** [github.com/seu-user/sati-mcp](https://github.com/seu-user/sati-mcp)

---

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=seu-user/sati-mcp&type=Date)](https://star-history.com/#seu-user/sati-mcp&Date)

---

## 📖 Citação

> "Whāia te iti kahurangi, ki te tuohu koe, me he maunga teitei"  
> *Provérbio da língua Māori*
> 
> Tradução: "Busque o tesouro que você mais valoriza,  
> se você inclinar a cabeça, que seja para uma montanha elevada."

**Significado para Sati:** Honre seus hiperfocos. Eles são tesouros, não distrações.

---

**Vamos construir algo incrível juntos! 🚀**

*Última atualização: 08/10/2025*


# 📋 SATI - Lista de Tasks Prioritárias

**Data de Criação:** 09/10/2025  
**Status:** ✅ Erros Corrigidos | ⏳ Próximas Prioridades

---

## 🎉 ✅ CONCLUÍDO: Correção de Erros & Node.js Upgrade

### Node.js Upgrade (09/10/2025)

4. **✅ Concluído:** Upgrade Node.js v18.19.1 → v22.20.0 LTS
   - Instalado nvm (Node Version Manager) v0.39.5
   - Atualizado para Node.js v22.20.0 (Latest LTS: Jod)
   - Atualizado npm v9.x → v10.9.3
   - **✅ Resolvido:** Warnings Supabase sobre Node.js deprecated
   - **✅ Verificado:** Build e dev server funcionando perfeitamente
   - **✅ Performance:** Ready time melhorou (~1.5s)

### Build Errors Resolvidos (09/10/2025)

1. **✅ Corrigido:** `mcp-simulator/page.tsx` - Tipos `ToolDemoConfig` não definidos
   - Adicionados imports necessários dos componentes SATI
   - Definidos tipos customizados para o simulador
   - Criada função helper `createSimulatorMessage()`
   - Removida dependência de `createMessage` incompatível

2. **✅ Corrigido:** `chat/hooks.ts` - Tabela `user_api_keys` não existente
   - Comentada funcionalidade temporariamente
   - Habilitado modo desenvolvimento (assume API key presente)
   - TODO identificado para implementação futura

3. **✅ Verificado:** Build passa com sucesso
   - TypeScript errors resolvidos
   - Componentes carregando corretamente
   - Warnings de Node.js 18 identificados (não blockers)

---

## 🚀 PRÓXIMAS PRIORIDADES (Ordem de Execução)

### 🎯 **FASE 1: Integração OpenAI Real (2-3 dias)**

#### **Day 2.1: Setup OpenAI Integration**
- [x] **P0 - Instalar dependências OpenAI** ✅
  ```bash
  npm install openai ai @ai-sdk/openai
  npm install react-markdown remark-gfm
  npm install framer-motion
  ```
  
- [x] **P0 - Implementar API Key Management** ✅
  - [x] Atualizar `database.d.ts` com tipos da tabela `user_api_keys`
  - [x] Descomentar e corrigir `checkApiKey()` em `hooks.ts`
  - [x] Criar service: `src/lib/services/apiKey.service.ts`

- [x] **P0 - Criar Settings Page** ✅
  - [x] `src/app/settings/page.tsx` - Página de configurações
  - [x] `src/components/settings/ApiKeyForm.tsx` - Form para API key
  - [x] Validação em tempo real da API key
  - [x] Instruções para obter API key OpenAI

#### **Day 2.2: Chat com OpenAI Real**
- [x] **P0 - Implementar `/api/chat` real** ✅
  - [x] Integrar OpenAI SDK no endpoint existente ✅
  - [x] Implementar streaming de respostas ✅
  - [x] Buscar API key do usuário (Supabase) ✅
  - [x] Error handling robusto ✅

- [x] **P0 - Conectar Chat Interface** ✅
  - [x] Atualizar `ChatInterface.tsx` para usar API real ✅ (já estava compatível)
  - [x] Implementar loading states ✅ (já existem)
  - [x] Adicionar error boundaries ✅ (já existem)
  - [x] Testar fluxo end-to-end ✅

#### **Day 2.3: Execução MCP Tools**
- [ ] **P1 - Detectar Tool Calls**
  - [ ] Parser de tool calls no streaming
  - [ ] Mapeamento para nossas 10 MCP tools
  - [ ] Validação de parâmetros

- [ ] **P1 - Executar MCP Tools**
  - [ ] Integrar com `src/lib/mcp/tools/`
  - [ ] Retornar resultados para OpenAI
  - [ ] Error handling específico por tool

- [ ] **P1 - Renderizar Componentes**
  - [ ] Detectar qual componente renderizar
  - [ ] Passar dados corretos para componentes
  - [ ] Testar todos os 8 componentes SATI

---

### 🎯 **FASE 2: Layout & UX (2-3 dias)**

#### **Day 3.1: App Layout**
- [ ] **P1 - Estrutura de Layout**
  - [ ] `src/app/(authenticated)/layout.tsx`
  - [ ] Sidebar com navegação
  - [ ] Header com breadcrumbs
  - [ ] Responsive design

- [ ] **P1 - Dashboard Page**
  - [ ] `src/app/(authenticated)/dashboard/page.tsx`
  - [ ] Overview de hiperfocos
  - [ ] Estatísticas rápidas
  - [ ] Quick actions

#### **Day 3.2: Navegação & Polish**
- [ ] **P2 - Páginas Principais**
  - [ ] Chat page polida
  - [ ] Settings page completa
  - [ ] Profile page básica

- [ ] **P2 - Mobile Optimization**
  - [ ] Touch-friendly interface
  - [ ] Responsive breakpoints
  - [ ] Mobile menu

---

### 🎯 **FASE 3: Autenticação & Deployment (1-2 dias)**

#### **Day 4.1: Auth Sistema**
- [ ] **P1 - Auth Pages**
  - [ ] `src/app/auth/login/page.tsx`
  - [ ] `src/app/auth/signup/page.tsx`
  - [ ] `src/app/auth/forgot-password/page.tsx`

- [ ] **P1 - Auth Middleware**
  - [ ] Proteger rotas privadas
  - [ ] Redirect logic
  - [ ] Session management

#### **Day 4.2: Deployment Prep**
- [ ] **P2 - Environment Setup**
  - [ ] `.env.example` completo
  - [ ] Supabase production config
  - [ ] Vercel deployment settings

- [ ] **P2 - Testing & QA**
  - [ ] Teste fluxo completo
  - [ ] Error scenarios
  - [ ] Performance check

---

## 🔧 **TASKS TÉCNICAS PARALELAS**

### **Database & Schema**
- [ ] **P0** - Executar migration `add-user-api-keys.sql`
- [ ] **P1** - Regenerar `database.d.ts` com Supabase CLI
- [ ] **P2** - Otimizar queries e índices
- [ ] **P2** - Backup strategy

### **Developer Experience**
- [x] **P2** - ✅ **CONCLUÍDO:** Atualizar Node.js para v22.20.0 LTS (resolve warnings Supabase)
- [ ] **P2** - ESLint rules (remover `ignoreDuringBuilds`)
- [ ] **P2** - Add pre-commit hooks
- [ ] **P3** - Setup Storybook para componentes

### **Documentação**
- [ ] **P1** - README.md com setup instructions
- [ ] **P2** - API documentation
- [ ] **P2** - Component documentation
- [ ] **P3** - Deployment guide

---

## 📊 **MÉTRICAS & OBJETIVOS**

### **Estimativas de Tempo**
- ⏱️ **Fase 1 (OpenAI):** 2-3 dias de trabalho focado
- ⏱️ **Fase 2 (Layout):** 2-3 dias
- ⏱️ **Fase 3 (Auth):** 1-2 dias
- 🎯 **Total MVP:** 5-8 dias = 1-2 semanas

### **Definition of Done - MVP**
- ✅ Usuário pode fazer login/signup
- ✅ Usuário pode inserir API key OpenAI
- ✅ Chat funciona com streaming real
- ✅ MCP tools executam e rendem componentes
- ✅ Layout responsivo e polido
- ✅ Deploy funcionando em produção

### **Success Metrics**
- 🎯 Build time < 10s
- 🎯 First paint < 2s
- 🎯 Chat response < 1s (stream start)
- 🎯 Zero TypeScript errors
- 🎯 Mobile-friendly (Lighthouse > 80)

---

## 🚨 **RISCOS IDENTIFICADOS**

### **Technical Risks**
1. **⚠️ OpenAI Rate Limits**
   - Mitigação: Implementar rate limiting local
   - Fallback: Error messages amigáveis

2. **⚠️ Supabase Free Tier**
   - Mitigação: Monitor usage
   - Plano: Upgrade path definido

3. **⚠️ Component Complexity**
   - Mitigação: Testes isolados
   - Fallback: Componentes simplificados

### **UX Risks**
1. **⚠️ ADHD-Specific Design**
   - Mitigação: User testing com neurodivergentes
   - Iteração: Feedback rápido

2. **⚠️ API Key UX**
   - Mitigação: Onboarding claro
   - Suporte: FAQ detalhado

---

## 🎯 **CRITÉRIOS DE SUCESSO**

### **Fase 1 Ready** ✅
- [ ] Chat funcional com OpenAI
- [ ] Pelo menos 3 MCP tools executando
- [ ] API key management working
- [ ] Componentes renderizando

### **MVP Ready** 🎯
- [ ] Todas as 10 MCP tools
- [ ] Auth completo
- [ ] Layout polido
- [ ] Mobile responsive
- [ ] Deployed & accessible

### **Beta Ready** 🚀
- [ ] User feedback incorporated
- [ ] Performance optimized
- [ ] Error handling robusto
- [ ] Analytics implementado

---

## 📝 **NOTAS DE IMPLEMENTAÇÃO**

### **Priorização**
- **P0** = Blocker para próxima fase
- **P1** = Necessário para MVP
- **P2** = Nice to have para MVP
- **P3** = Post-MVP

### **Trabalho Paralelo**
Tasks P2/P3 podem ser feitas paralelamente às P0/P1 quando há dependências ou tempo de espera.

### **Testing Strategy**
Cada fase deve incluir:
- Manual testing do fluxo completo
- Verificação de build success
- Quick smoke test em mobile

---

**📅 Próxima Atualização:** Após conclusão da Fase 1  
**🎯 Meta:** MVP funcional em 1-2 semanas  
**🚀 Objetivo:** Beta público em 1 mês

---

*Criado em: 09/10/2025*  
*Última atualização: 09/10/2025*  
*Status: 🔥 Pronto para execução*
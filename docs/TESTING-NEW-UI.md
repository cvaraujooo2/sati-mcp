# Guia de Teste - Nova UI/UX do SATI

## ✅ Checklist de Testes

### 1. Autenticação
- [ ] Acessar `/` redireciona para `/login` (não autenticado)
- [ ] Login funciona corretamente
- [ ] Após login, redireciona para `/chat`
- [ ] Logout funciona e redireciona para `/login`

### 2. Sidebar (Desktop)
- [ ] Sidebar aparece no lado esquerdo
- [ ] Logo SATI visível no topo
- [ ] 4 itens de navegação visíveis (Chat, Hiperfocos, Sessões, Configurações)
- [ ] Item ativo destacado em purple
- [ ] Botão "Recolher" no rodapé funciona
- [ ] Sidebar colapsado mostra apenas ícones
- [ ] Tooltips aparecem ao passar mouse nos ícones (sidebar colapsado)
- [ ] Navegação entre páginas funciona
- [ ] Estado do sidebar (aberto/fechado) persiste ao navegar

### 3. Sidebar (Mobile < 768px)
- [ ] Sidebar começa oculta
- [ ] Botão menu (hamburguer) visível no header
- [ ] Clicar no menu abre sidebar como overlay
- [ ] Backdrop escuro aparece atrás da sidebar
- [ ] Clicar no backdrop fecha a sidebar
- [ ] Clicar em um link fecha a sidebar
- [ ] Botão X no topo da sidebar fecha ela

### 4. Header
- [ ] Header fixo no topo
- [ ] Título "SATI" ou título da página visível
- [ ] UserMenu no canto direito
- [ ] Avatar com iniciais do usuário
- [ ] Nome do usuário visível (desktop)
- [ ] Nome do usuário oculto (mobile)

### 5. UserMenu
- [ ] Clicar no avatar abre dropdown
- [ ] Email do usuário visível no topo
- [ ] Opção "Meu Perfil" visível
- [ ] Opção "Configurações" visível
- [ ] Opção "Sair" em vermelho
- [ ] Footer com "💜 SATI para neurodivergentes"
- [ ] Clicar em "Configurações" navega para `/settings`
- [ ] Clicar em "Sair" faz logout
- [ ] Clicar fora do menu fecha ele

### 6. Sistema de Temas
- [ ] Acessar `/settings` → aba "Preferências"
- [ ] Três opções de tema visíveis: Claro, Escuro, Sistema
- [ ] Tema ativo destacado com borda roxa
- [ ] Clicar em "Claro" aplica tema claro
- [ ] Clicar em "Escuro" aplica tema escuro
- [ ] Clicar em "Sistema" segue preferência do SO
- [ ] Tema persiste após refresh da página
- [ ] Preview de cores visível abaixo

### 7. Responsividade
- [ ] Desktop (≥768px): Sidebar lateral, nome usuário visível
- [ ] Tablet (768px-1024px): Sidebar lateral, ajustes de espaçamento
- [ ] Mobile (<768px): Sidebar overlay, menu hamburguer
- [ ] Redimensionar janela atualiza layout corretamente

### 8. Páginas Autenticadas
- [ ] `/chat` - Interface de chat funciona, sem header duplicado
- [ ] `/settings` - Configurações carregam corretamente
- [ ] `/hyperfocus` - Placeholder visível
- [ ] `/sessions` - Placeholder visível
- [ ] Todas têm Sidebar + Header

### 9. Tema Light
- [ ] Background branco
- [ ] Texto escuro legível
- [ ] Sidebar com fundo quase branco
- [ ] Links ativos em purple
- [ ] Contraste adequado

### 10. Tema Dark
- [ ] Background quase preto
- [ ] Texto claro legível
- [ ] Sidebar com fundo cinza escuro
- [ ] Links ativos em purple claro
- [ ] Sem strain visual

### 11. Acessibilidade
- [ ] Tab navega pelos elementos corretamente
- [ ] Enter abre/fecha menus
- [ ] Escape fecha dropdowns
- [ ] Focus indicators visíveis
- [ ] Cores com contraste adequado (WCAG AA)

### 12. Performance
- [ ] Transições suaves (sem lag)
- [ ] Sidebar abre/fecha rapidamente
- [ ] Troca de tema instantânea
- [ ] Navegação rápida entre páginas

## 🐛 Problemas Conhecidos

Nenhum no momento.

## 📝 Como Testar

### Teste Completo (Desktop)

1. **Fazer logout** (se autenticado)
2. **Acessar** `http://localhost:3000`
3. **Verificar** redirecionamento para `/login`
4. **Fazer login** com credenciais válidas
5. **Verificar** redirecionamento para `/chat`
6. **Testar sidebar:**
   - Clicar em "Recolher"
   - Passar mouse nos ícones (tooltips)
   - Navegar entre páginas
   - Verificar item ativo
7. **Testar UserMenu:**
   - Clicar no avatar
   - Verificar opções
   - Clicar em "Configurações"
8. **Testar temas:**
   - Ir para aba "Preferências"
   - Alternar entre Light/Dark/System
   - Verificar persistência (refresh)
9. **Testar logout**

### Teste Rápido (Mobile)

1. **Abrir DevTools** → Responsive mode
2. **Selecionar** iPhone ou Android
3. **Fazer login**
4. **Testar menu hamburguer**
5. **Testar navegação**
6. **Testar UserMenu**
7. **Verificar layout responsivo**

### Teste de Temas

1. **Acessar** `/settings`
2. **Clicar** em "Preferências"
3. **Selecionar** "Escuro"
4. **Verificar** aplicação imediata
5. **Refresh** da página
6. **Verificar** tema persistiu
7. **Selecionar** "Claro"
8. **Verificar** aplicação e persistência

## 🚀 Comandos Úteis

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Verificar erros de linting
npm run lint

# Type checking
npm run type-check

# Rodar testes
npm test
```

## 📱 Dispositivos Recomendados para Teste

- **Desktop:** 1920x1080 (Chrome, Firefox, Safari)
- **Tablet:** iPad (1024x768)
- **Mobile:** iPhone 12/13 (390x844), Android (360x640)

## 🔍 Ferramentas de Debug

### React DevTools
- Verificar estado de contextos (ThemeContext)
- Inspecionar componentes

### Browser DevTools
- Console: Verificar erros/warnings
- Network: Verificar requisições
- Application → localStorage: Ver tema salvo

## ✅ Critérios de Aceitação

- [ ] Todos os itens do checklist passaram
- [ ] Sem erros no console
- [ ] Sem warnings críticos
- [ ] Performance aceitável (transições < 300ms)
- [ ] Acessibilidade básica funciona
- [ ] Responsividade em 3 breakpoints testada

## 📞 Reportar Problemas

Se encontrar problemas:
1. Verificar console para erros
2. Tentar em modo incógnito
3. Limpar localStorage
4. Documentar passos para reproduzir
5. Reportar no canal apropriado

---

**Última atualização:** 14/10/2025  
**Versão UI:** v0.2.0


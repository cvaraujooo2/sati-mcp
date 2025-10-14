# Estrutura UI/UX do SATI

## Visão Geral

O SATI agora possui uma interface completa com sidebar, header e sistema de temas configurável, seguindo as melhores práticas de UX para aplicações web modernas.

## Componentes Principais

### 1. Sistema de Temas

**Localização:** `src/lib/contexts/theme-context.tsx`

O sistema de temas permite alternar entre:
- **Light**: Tema claro ideal para ambientes bem iluminados
- **Dark**: Tema escuro que reduz fadiga visual
- **System**: Segue automaticamente as preferências do sistema operacional

**Uso:**
```tsx
import { useTheme } from '@/lib/hooks/useTheme'

function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  
  return (
    <button onClick={() => setTheme('dark')}>
      Mudar para tema escuro
    </button>
  )
}
```

**Persistência:** O tema escolhido é salvo no `localStorage` e restaurado automaticamente.

### 2. Sidebar

**Localização:** `src/components/layout/Sidebar.tsx`

Barra lateral de navegação com os seguintes recursos:
- **Colapsável**: Pode ser recolhida para economizar espaço (w-64 → w-16)
- **Responsiva**: Vira overlay no mobile (< 768px)
- **Itens de navegação**:
  - Chat (MessageSquare icon)
  - Hiperfocos (Zap icon)
  - Sessões (Clock icon)
  - Configurações (Settings icon)

**Features:**
- Logo do SATI no topo
- Links ativos destacados automaticamente
- Tooltips nos ícones quando colapsado
- Animações suaves de transição

### 3. Header

**Localização:** `src/components/layout/Header.tsx`

Barra superior fixa com:
- Botão de menu para mobile (toggle sidebar)
- Título da página atual
- Menu do usuário (UserMenu)
- Background com blur para efeito glassmorphism

### 4. UserMenu

**Localização:** `src/components/layout/UserMenu.tsx`

Menu dropdown do usuário com:
- Avatar com iniciais geradas do email
- Nome do usuário
- Opções:
  - Meu Perfil (em desenvolvimento)
  - Configurações
  - Sair (logout)

**Tecnologia:** Usa Radix UI DropdownMenu para acessibilidade e UX

## Layout Autenticado

**Localização:** `src/app/(authenticated)/layout.tsx`

Layout wrapper que:
1. Verifica autenticação do usuário via Supabase
2. Redireciona para login se não autenticado
3. Fornece Sidebar + Header + ThemeProvider
4. Detecta mobile automaticamente
5. Gerencia estado do sidebar (aberto/fechado)

**Estrutura:**
```
┌─────────────────────────────────────┐
│           Header (fixo)             │
├──────────┬──────────────────────────┤
│          │                          │
│ Sidebar  │   Conteúdo da Página    │
│          │   (children)             │
│          │                          │
└──────────┴──────────────────────────┘
```

## Rotas

### Rotas Autenticadas (com Sidebar + Header)

Localizadas em `src/app/(authenticated)/`:
- `/chat` - Interface de chat com o SATI
- `/hyperfocus` - Gerenciamento de hiperfocos (em desenvolvimento)
- `/sessions` - Histórico de sessões (em desenvolvimento)
- `/settings` - Configurações e preferências

### Rotas Públicas (sem Sidebar)

Localizadas em `src/app/(auth)/`:
- `/login` - Página de login
- `/signup` - Página de cadastro

### Rota Raiz

`src/app/page.tsx` - Redireciona automaticamente para `/chat` (autenticado) ou `/login` (não autenticado)

## Tema Purple/Blue Gradient

O SATI usa uma paleta de cores personalizada com gradiente purple/blue:

### Cores Principais

**Light Mode:**
- Primary: `oklch(0.55 0.2 285)` - Purple vibrante
- Background: `oklch(1 0 0)` - Branco puro
- Sidebar: `oklch(0.99 0 0)` - Quase branco

**Dark Mode:**
- Primary: `oklch(0.65 0.2 285)` - Purple mais claro
- Background: `oklch(0.145 0 0)` - Quase preto
- Sidebar: `oklch(0.18 0 0)` - Cinza muito escuro

### Variáveis CSS Personalizadas

```css
--sati-purple: oklch(0.6 0.2 300);
--sati-blue: oklch(0.6 0.15 240);
--sati-purple-light: oklch(0.95 0.05 300);
--sati-blue-light: oklch(0.95 0.05 240);
```

## Configuração de Tema em Settings

A página de configurações (`/settings`) possui uma aba "Preferências" onde o usuário pode:
- Alternar entre temas Light/Dark/System
- Ver preview das cores do tema
- Informações sobre design neurodivergente-friendly

## Acessibilidade

Todos os componentes foram desenvolvidos com acessibilidade em mente:
- **Keyboard navigation**: Todos os controles acessíveis via teclado
- **ARIA labels**: Labels apropriados para screen readers
- **Focus indicators**: Indicadores visuais claros de foco
- **Color contrast**: Contraste adequado para leitura (WCAG AA)

## Responsividade

### Breakpoints

- **Mobile**: < 768px
  - Sidebar como overlay
  - Nome do usuário oculto
  - Menu hamburguer visível
  
- **Desktop**: ≥ 768px
  - Sidebar permanente
  - Nome do usuário visível
  - Toggle de collapse visível

## Performance

- **Lazy loading**: Rotas carregadas sob demanda
- **Memoization**: Componentes otimizados com React
- **CSS transitions**: Animações via CSS em vez de JS
- **Tree shaking**: Importações otimizadas

## Desenvolvimento

### Adicionar Nova Rota Autenticada

1. Criar pasta em `src/app/(authenticated)/nova-rota/`
2. Criar `page.tsx` na pasta
3. O layout autenticado será aplicado automaticamente
4. Adicionar item no Sidebar se necessário (editar `Sidebar.tsx`)

### Adicionar Novo Item de Menu do Usuário

Editar `src/components/layout/UserMenu.tsx` e adicionar novo `DropdownMenuItem`.

### Customizar Cores do Tema

Editar `src/app/globals.css` nas seções `:root` e `.dark`.

## Próximos Passos

- [ ] Implementar página de Hiperfocos
- [ ] Implementar página de Sessões
- [ ] Adicionar aba "Conta" em Settings
- [ ] Adicionar notificações no header
- [ ] Implementar busca global
- [ ] Adicionar breadcrumbs dinâmicos
- [ ] Suporte a múltiplos temas (além de light/dark)

## Suporte

Para questões ou problemas, consulte:
- Documentação completa: `/docs/`
- Troubleshooting: `/docs/TROUBLESHOOTING.md`
- Issues no GitHub (quando disponível)

---

**Desenvolvido com 💜 para pessoas neurodivergentes**


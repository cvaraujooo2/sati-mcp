# Guia Rápido: Testando o Sistema de Tarefas ✅

**Status:** Implementação Concluída  
**Data:** 14 de Outubro, 2025

## ✅ O que foi Implementado

Sistema completo de CRUD de tarefas integrado aos hiperfocos, com:
- ✅ Listagem de tarefas com progresso visual
- ✅ Criação de tarefas via dialog
- ✅ Toggle de conclusão (optimistic updates)
- ✅ Deleção de tarefas
- ✅ Estatísticas em tempo real
- ✅ Integração completa com Supabase

## 🚀 Como Testar

### 1. Iniciar o Servidor

```bash
npm run dev
```

### 2. Acessar a Página de Hiperfocos

1. Abra o navegador em `http://localhost:3000`
2. Faça login (se necessário)
3. Navegue para **Hiperfocos** no menu lateral

### 3. Abrir Detalhes de um Hiperfoco

1. Clique em qualquer card de hiperfoco **OU**
2. Clique no menu "⋮" e selecione "Ver Detalhes"
3. O drawer lateral abrirá

### 4. Testar Funcionalidades

#### ✅ Criar Tarefa

1. No drawer, clique em **"Adicionar Tarefa"**
2. Preencha:
   - **Título** (obrigatório): Ex: "Estudar hooks do React"
   - **Descrição** (opcional): Ex: "useState e useEffect"
   - **Tempo Estimado** (opcional): Ex: 30 minutos
3. Clique em **"Criar Tarefa"**
4. A tarefa aparece instantaneamente na lista

#### ✅ Completar Tarefa

1. Clique no **checkbox** ao lado da tarefa
2. A tarefa é marcada com ~~riscado~~
3. A **barra de progresso** atualiza
4. O contador de "X de Y concluídas" atualiza

#### ✅ Desmarcar Tarefa

1. Clique novamente no **checkbox**
2. O riscado é removido
3. Progresso atualiza

#### ✅ Deletar Tarefa

1. **Passe o mouse** sobre uma tarefa
2. Clique no ícone de **lixeira** 🗑️
3. Confirme a deleção
4. Tarefa é removida

### 5. Verificar Estatísticas

#### No Drawer:
- **"Tarefas: X de Y concluídas"** - deve mostrar contagem correta
- **"Tempo estimado: Xh Ym"** - soma dos tempos das tarefas

#### Na Lista de Tarefas:
- **"X de Y concluídas"** no topo
- **Badge com %** de progresso
- **Barra de progresso verde** visual

## 🎨 O que Você Deve Ver

### Estado Vazio (sem tarefas):
```
┌────────────────────────────────┐
│        Tarefas                 │
├────────────────────────────────┤
│           ○                    │
│  Nenhuma tarefa criada ainda   │
│  Clique no botão abaixo...     │
│                                │
│  [+ Adicionar Tarefa]          │
└────────────────────────────────┘
```

### Com Tarefas:
```
┌────────────────────────────────┐
│        Tarefas                 │
│  ✓ 2 de 3 concluídas    [67%] │
│  ▓▓▓▓▓▓▓▓▓▓▓░░░░ 67%          │
├────────────────────────────────┤
│  ☑ 1. Estudar React           │
│     └ useState e useEffect     │
│        🕐 30 min               │
│                                │
│  ☑ 2. Fazer exercícios        │
│                                │
│  ☐ 3. Revisar código          │
│        🕐 45 min               │
│                                │
│  [+ Adicionar Tarefa]          │
└────────────────────────────────┘
```

## 🧪 Casos de Teste

### Caso 1: Criar Tarefa Mínima
- [ ] Título: "Teste"
- [ ] Deixar descrição e tempo vazios
- [ ] Deve criar com sucesso

### Caso 2: Criar Tarefa Completa
- [ ] Título: "Tarefa Completa"
- [ ] Descrição: "Com todos os campos"
- [ ] Tempo: 60
- [ ] Deve criar com todos os dados

### Caso 3: Validações
- [ ] Tentar criar sem título → deve mostrar erro
- [ ] Título com 1 caractere → deve mostrar erro
- [ ] Tempo negativo → deve mostrar erro

### Caso 4: Toggle Rápido
- [ ] Clicar rapidamente no checkbox várias vezes
- [ ] Deve responder instantaneamente (optimistic)
- [ ] Deve manter estado correto

### Caso 5: Múltiplas Tarefas
- [ ] Criar 5 tarefas
- [ ] Completar 3
- [ ] Verificar progresso mostra "3 de 5 concluídas (60%)"

### Caso 6: Persistência
- [ ] Criar tarefas
- [ ] Fechar drawer
- [ ] Reabrir drawer
- [ ] Tarefas devem estar lá

### Caso 7: Reload da Página
- [ ] Criar tarefas
- [ ] Recarregar página (F5)
- [ ] Abrir hiperfoco
- [ ] Tarefas devem estar salvas no Supabase

## 🐛 Problemas Comuns

### Tarefas não aparecem
**Solução:** Verifique o console do navegador (F12) para erros de API

### Loading infinito
**Solução:** Verifique conexão com Supabase

### Erro ao criar tarefa
**Solução:** Verifique se o usuário tem permissão no Supabase RLS

### Checkbox não responde
**Solução:** Verifique se não há erros no console

## 📊 Métricas de Performance

### Optimistic Updates
- Toggle de checkbox deve ser **instantâneo** (< 50ms)
- Se houver erro, deve reverter automaticamente

### Loading States
- Skeleton deve aparecer enquanto carrega
- Deve desaparecer quando dados chegam

### Animações
- Barra de progresso deve animar suavemente
- Hover effects devem ser fluidos

## 🎯 Funcionalidades Futuras (Não Implementadas)

- [ ] Editar tarefa inline
- [ ] Reordenar tarefas (drag & drop)
- [ ] Subtarefas
- [ ] Prioridades
- [ ] Tags
- [ ] Data de vencimento
- [ ] Anexos

## ✅ Checklist de Conclusão

- [x] TaskService integrado
- [x] useTasks hook funcional
- [x] TaskList component criado
- [x] CreateTaskDialog criado
- [x] Checkbox component criado
- [x] Integração no HyperfocusDetailDrawer
- [x] Estatísticas calculadas
- [x] Optimistic updates
- [x] Error handling
- [x] Loading states
- [x] Empty states
- [x] Validações
- [x] Persistência no Supabase
- [x] Documentação completa

## 📝 Notas Técnicas

### Arquivos Criados:
- `src/app/components/tasks/TaskList.tsx`
- `src/app/components/tasks/CreateTaskDialog.tsx`
- `src/app/components/tasks/index.tsx`
- `src/app/components/ui/checkbox.tsx`

### Arquivos Atualizados:
- `src/app/components/hyperfocus/HyperfocusDetailDrawer.tsx`

### Arquivos Removidos:
- `src/components/hyperfocus/HyperfocusDetailDrawer.tsx` (duplicado)

## 🎉 Conclusão

O sistema de tarefas está **100% funcional** e pronto para uso!

**Próximo Sprint:** Sprint 3 - Página de Sessões

---

**Desenvolvido com 💜 para pessoas neurodivergentes**


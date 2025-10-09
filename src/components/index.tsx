import React from 'react';
import ReactDOM from 'react-dom/client';
import { HyperfocusCard } from './HyperfocusCard';
import { TaskBreakdown } from './TaskBreakdown';
import { FocusTimer } from './FocusTimer';
import { HyperfocusList } from './HyperfocusList';
import { AlternancyFlow } from './AlternancyFlow';
import { ContextAnalysis } from './ContextAnalysis';
import { SubtaskSuggestions } from './SubtaskSuggestions';
import { FocusSessionSummary } from './FocusSessionSummary';

// Registry de componentes
const COMPONENTS = {
  HyperfocusCard,
  TaskBreakdown,
  FocusTimer,
  HyperfocusList,
  AlternancyFlow,
  ContextAnalysis,
  SubtaskSuggestions,
  FocusSessionSummary,
} satisfies Record<string, React.ComponentType<Record<string, unknown>>>;

declare global {
  interface Window {
    renderMCPComponent?: (
      containerId: string,
      componentName: keyof typeof COMPONENTS,
      props: Record<string, unknown>
    ) => void;
  }
}

window.renderMCPComponent = function renderMCPComponent(
  containerId,
  componentName,
  props
) {
  const Component = COMPONENTS[componentName] as React.ComponentType<Record<string, unknown>>;

  if (!Component) {
    console.error(`Component ${componentName} not found`);
    return;
  }

  const container = document.getElementById(containerId);

  if (!container) {
    console.error(`Container ${containerId} not found`);
    return;
  }

  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <Component {...(props as Record<string, unknown>)} />
    </React.StrictMode>
  );
};

export { 
  HyperfocusCard, 
  TaskBreakdown, 
  FocusTimer, 
  HyperfocusList, 
  AlternancyFlow, 
  ContextAnalysis,
  SubtaskSuggestions,
  FocusSessionSummary
};


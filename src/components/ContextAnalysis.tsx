import React, { useCallback } from 'react';
import { Brain, Clock, GitBranch, ListTree, AlertCircle, Sparkles } from 'lucide-react';
import { useToolInput, useToolOutput, useTheme } from './hooks/useOpenAi';

interface ContextAnalysisInput {
  contextDescription: string;
  analysisType: 'complexity' | 'time_estimate' | 'dependencies' | 'breakdown' | 'priority';
}

interface ComplexityAnalysis {
  level: 'low' | 'medium' | 'high' | 'very_high';
  score: number;
  factors: string[];
  recommendation: string;
}

interface TimeEstimateAnalysis {
  estimatedMinutes: number;
  confidence: 'low' | 'medium' | 'high';
  breakdown: { phase: string; minutes: number }[];
  bufferPercentage: number;
}

interface DependenciesAnalysis {
  dependencies: { id: string; title: string; blocking: boolean }[];
  canStartNow: boolean;
  blockers: string[];
}

interface BreakdownAnalysis {
  suggestedTasks: { title: string; description: string; estimatedMinutes: number }[];
  totalTasks: number;
}

interface PriorityAnalysis {
  priorityLevel: 'urgent' | 'high' | 'medium' | 'low';
  urgencyScore: number;
  impactScore: number;
  reasoning: string;
  suggestedStartDate: string;
}

type AnalysisResult =
  | ComplexityAnalysis
  | TimeEstimateAnalysis
  | DependenciesAnalysis
  | BreakdownAnalysis
  | PriorityAnalysis;

interface ContextAnalysisOutput {
  analysisType: string;
  result: AnalysisResult;
  insights: string[];
}

const analysisIcons = {
  complexity: Brain,
  time_estimate: Clock,
  dependencies: GitBranch,
  breakdown: ListTree,
  priority: AlertCircle,
};

const complexityColors = {
  low: 'text-green-500',
  medium: 'text-yellow-500',
  high: 'text-orange-500',
  very_high: 'text-red-500',
};

const priorityColors = {
  urgent: 'text-red-500',
  high: 'text-orange-500',
  medium: 'text-yellow-500',
  low: 'text-green-500',
};

export function ContextAnalysis() {
  const toolInput = useToolInput<ContextAnalysisInput>();
  const toolOutput = useToolOutput<ContextAnalysisOutput>();
  const theme = useTheme();

  const analysisType = toolOutput?.analysisType || toolInput?.analysisType || 'complexity';
  const result = toolOutput?.result;
  const insights = toolOutput?.insights || [];

  const handleCreateHyperfocus = useCallback(async () => {
    if (window.openai?.sendFollowUpMessage && toolInput?.contextDescription) {
      await window.openai.sendFollowUpMessage({
        prompt: `Criar hiperfoco: ${toolInput.contextDescription}`,
      });
    }
  }, [toolInput?.contextDescription]);

  const handleBreakIntoTasks = useCallback(async () => {
    if (window.openai?.sendFollowUpMessage) {
      await window.openai.sendFollowUpMessage({
        prompt: 'Quebrar isso em tarefas detalhadas',
      });
    }
  }, []);

  const cardBg = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const mutedColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-300';

  const AnalysisIcon = analysisIcons[analysisType as keyof typeof analysisIcons] || Brain;

  if (!result) {
    return (
      <div className={`${cardBg} rounded-lg p-6 border ${borderColor} max-w-2xl`}>
        <div className="text-center">
          <Brain className={`mx-auto mb-4 ${mutedColor}`} size={48} />
          <p className={mutedColor}>Analisando contexto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${cardBg} rounded-lg p-6 border ${borderColor} max-w-2xl`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <div className={`p-3 rounded-lg bg-blue-600/20`}>
          <AnalysisIcon className="text-blue-500" size={24} />
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${textColor} mb-1`}>
            🔍 Análise de Contexto
          </h3>
          <p className={`text-sm ${mutedColor}`}>
            {analysisType === 'complexity' && 'Complexidade do projeto'}
            {analysisType === 'time_estimate' && 'Estimativa de tempo'}
            {analysisType === 'dependencies' && 'Análise de dependências'}
            {analysisType === 'breakdown' && 'Quebra em subtarefas'}
            {analysisType === 'priority' && 'Análise de prioridade'}
          </p>
        </div>
      </div>

      {/* Resultado baseado no tipo */}
      <div className="mb-6">
        {analysisType === 'complexity' && 'level' in result && (
          <ComplexityResult result={result as ComplexityAnalysis} theme={theme} />
        )}

        {analysisType === 'time_estimate' && 'estimatedMinutes' in result && (
          <TimeEstimateResult result={result as TimeEstimateAnalysis} theme={theme} />
        )}

        {analysisType === 'dependencies' && 'dependencies' in result && (
          <DependenciesResult result={result as DependenciesAnalysis} theme={theme} />
        )}

        {analysisType === 'breakdown' && 'suggestedTasks' in result && (
          <BreakdownResult result={result as BreakdownAnalysis} theme={theme} />
        )}

        {analysisType === 'priority' && 'priorityLevel' in result && (
          <PriorityResult result={result as PriorityAnalysis} theme={theme} />
        )}
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className={`${cardBg} border ${borderColor} rounded-lg p-4 mb-6`}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="text-yellow-500" size={18} />
            <h4 className={`font-semibold ${textColor}`}>Insights</h4>
          </div>
          <ul className="space-y-2">
            {insights.map((insight, index) => (
              <li key={index} className={`text-sm ${mutedColor} flex gap-2`}>
                <span>•</span>
                <span className="flex-1">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-3">
        <button
          onClick={handleCreateHyperfocus}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
        >
          ✨ Criar Hiperfoco
        </button>
        <button
          onClick={handleBreakIntoTasks}
          className={`flex-1 px-4 py-2 ${cardBg} border ${borderColor} hover:bg-gray-700 rounded-lg transition-colors`}
        >
          📝 Quebrar em Tarefas
        </button>
      </div>
    </div>
  );
}

// Componente para resultado de complexidade
function ComplexityResult({ result, theme }: { result: ComplexityAnalysis; theme: string }) {
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const mutedColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const cardBg = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100';

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className={`text-sm ${mutedColor} mb-1`}>Nível de Complexidade</p>
          <p className={`text-2xl font-bold ${complexityColors[result.level]}`}>
            {result.level === 'low' && 'Baixa'}
            {result.level === 'medium' && 'Média'}
            {result.level === 'high' && 'Alta'}
            {result.level === 'very_high' && 'Muito Alta'}
          </p>
        </div>
        <div className={`text-4xl ${complexityColors[result.level]}`}>
          {result.score}/10
        </div>
      </div>

      <div className={`${cardBg} rounded-lg p-4 mb-4`}>
        <h4 className={`text-sm font-semibold ${textColor} mb-2`}>Fatores Identificados</h4>
        <ul className="space-y-1">
          {result.factors.map((factor, index) => (
            <li key={index} className={`text-sm ${mutedColor}`}>
              • {factor}
            </li>
          ))}
        </ul>
      </div>

      <div className={`${cardBg} rounded-lg p-4`}>
        <h4 className={`text-sm font-semibold ${textColor} mb-2`}>Recomendação</h4>
        <p className={`text-sm ${mutedColor}`}>{result.recommendation}</p>
      </div>
    </div>
  );
}

// Componente para resultado de estimativa de tempo
function TimeEstimateResult({ result, theme }: { result: TimeEstimateAnalysis; theme: string }) {
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const mutedColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const cardBg = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100';

  const hours = Math.floor(result.estimatedMinutes / 60);
  const minutes = result.estimatedMinutes % 60;

  return (
    <div>
      <div className="text-center mb-6">
        <p className={`text-sm ${mutedColor} mb-2`}>Tempo Estimado</p>
        <p className={`text-4xl font-bold ${textColor}`}>
          {hours > 0 && `${hours}h `}
          {minutes}min
        </p>
        <p className={`text-xs ${mutedColor} mt-2`}>
          Confiança: {result.confidence === 'high' ? 'Alta' : result.confidence === 'medium' ? 'Média' : 'Baixa'}
        </p>
      </div>

      {result.breakdown.length > 0 && (
        <div className={`${cardBg} rounded-lg p-4 mb-4`}>
          <h4 className={`text-sm font-semibold ${textColor} mb-3`}>Breakdown por Fase</h4>
          <div className="space-y-2">
            {result.breakdown.map((phase, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className={mutedColor}>{phase.phase}</span>
                <span className={textColor}>{phase.minutes}min</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.bufferPercentage > 0 && (
        <p className={`text-sm ${mutedColor} text-center`}>
          💡 Recomenda-se adicionar {result.bufferPercentage}% de buffer para imprevistos
        </p>
      )}
    </div>
  );
}

// Outros componentes de resultado...
function DependenciesResult({ result, theme }: { result: DependenciesAnalysis; theme: string }) {
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const mutedColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';

  return (
    <div>
      <div className="mb-4">
        <p className={`text-lg ${result.canStartNow ? 'text-green-500' : 'text-orange-500'}`}>
          {result.canStartNow ? '✅ Pode começar agora' : '⏳ Tem dependências bloqueantes'}
        </p>
      </div>

      {result.blockers.length > 0 && (
        <div className="space-y-2 mb-4">
          <h4 className={`text-sm font-semibold ${textColor}`}>Bloqueadores:</h4>
          {result.blockers.map((blocker, index) => (
            <p key={index} className={`text-sm ${mutedColor}`}>
              • {blocker}
            </p>
          ))}
        </div>
      )}

      {result.dependencies.length > 0 && (
        <div>
          <h4 className={`text-sm font-semibold ${textColor} mb-2`}>Dependências:</h4>
          {result.dependencies.map((dep) => (
            <p key={dep.id} className={`text-sm ${mutedColor}`}>
              {dep.blocking ? '🔴' : '🟡'} {dep.title}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function BreakdownResult({ result, theme }: { result: BreakdownAnalysis; theme: string }) {
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const mutedColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const cardBg = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100';

  return (
    <div>
      <p className={`${mutedColor} mb-4`}>
        Identificamos {result.totalTasks} tarefas recomendadas:
      </p>
      <div className="space-y-3">
        {result.suggestedTasks.map((task, index) => (
          <div key={index} className={`${cardBg} rounded-lg p-3`}>
            <div className="flex items-start justify-between mb-1">
              <h4 className={`font-medium ${textColor}`}>
                {index + 1}. {task.title}
              </h4>
              <span className={`text-xs ${mutedColor}`}>{task.estimatedMinutes}min</span>
            </div>
            <p className={`text-sm ${mutedColor}`}>{task.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PriorityResult({ result, theme }: { result: PriorityAnalysis; theme: string }) {
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const mutedColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const cardBg = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100';

  return (
    <div>
      <div className="text-center mb-6">
        <p className={`text-sm ${mutedColor} mb-2`}>Nível de Prioridade</p>
        <p className={`text-3xl font-bold ${priorityColors[result.priorityLevel]}`}>
          {result.priorityLevel === 'urgent' && '🚨 Urgente'}
          {result.priorityLevel === 'high' && '⬆️ Alta'}
          {result.priorityLevel === 'medium' && '➡️ Média'}
          {result.priorityLevel === 'low' && '⬇️ Baixa'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className={`${cardBg} rounded-lg p-3 text-center`}>
          <p className={`text-xs ${mutedColor} mb-1`}>Urgência</p>
          <p className={`text-2xl font-bold ${textColor}`}>{result.urgencyScore}/10</p>
        </div>
        <div className={`${cardBg} rounded-lg p-3 text-center`}>
          <p className={`text-xs ${mutedColor} mb-1`}>Impacto</p>
          <p className={`text-2xl font-bold ${textColor}`}>{result.impactScore}/10</p>
        </div>
      </div>

      <div className={`${cardBg} rounded-lg p-4`}>
        <h4 className={`text-sm font-semibold ${textColor} mb-2`}>Análise</h4>
        <p className={`text-sm ${mutedColor}`}>{result.reasoning}</p>
      </div>
    </div>
  );
}


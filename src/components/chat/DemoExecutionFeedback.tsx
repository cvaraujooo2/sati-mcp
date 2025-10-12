"use client";

import { motion } from "framer-motion";
import { Zap, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DemoExecutionFeedbackProps {
  isExecuting: boolean;
  toolName?: string;
  status?: 'executing' | 'success' | 'error';
  className?: string;
}

export function DemoExecutionFeedback({ 
  isExecuting, 
  toolName,
  status = 'executing',
  className 
}: DemoExecutionFeedbackProps) {
  if (!isExecuting && status === 'executing') return null;

  const getIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Zap className="h-4 w-4 text-blue-500" />;
    }
  };

  const getText = () => {
    switch (status) {
      case 'success':
        return `Demo "${toolName}" executada com sucesso`;
      case 'error':
        return `Erro ao executar demo "${toolName}"`;
      default:
        return `Executando demo "${toolName}"...`;
    }
  };

  const getBgColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800';
      default:
        return 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium",
        getBgColor(),
        className
      )}
    >
      {status === 'executing' ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          {getIcon()}
        </motion.div>
      ) : (
        getIcon()
      )}
      <span>{getText()}</span>
    </motion.div>
  );
}
import type { ReactNode } from 'react';
import {
  useSyncExternalStore,
  useEffect,
  useState,
  useCallback,
  createContext,
  useContext,
} from 'react';

// Types baseados na documentação oficial da OpenAI
export const SET_GLOBALS_EVENT_TYPE = 'openai:set_globals';

const globalWindow = typeof window === 'undefined' ? undefined : window;

type CustomEventConstructor = new <T>(
  type: string,
  eventInitDict?: CustomEventInit<T>
) => CustomEvent<T>;

const CustomEventBase: CustomEventConstructor =
  typeof globalThis !== 'undefined' && typeof (globalThis as { CustomEvent?: CustomEventConstructor }).CustomEvent === 'function'
    ? (globalThis as { CustomEvent: CustomEventConstructor }).CustomEvent
    : (class CustomEventPolyfill<T> extends Event {
        public detail: T;

        constructor(type: string, eventInitDict?: CustomEventInit<T>) {
          super(type, eventInitDict);
          this.detail = (eventInitDict?.detail ?? null) as T;
        }
      } as unknown as CustomEventConstructor);

export type DisplayMode = 'pip' | 'inline' | 'fullscreen';
export type Theme = 'light' | 'dark';
export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'unknown';

export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface SafeArea {
  insets: SafeAreaInsets;
}

export interface UserAgent {
  device: { type: DeviceType };
  capabilities: {
    hover: boolean;
    touch: boolean;
  };
}

export interface OpenAiGlobals<
  ToolInput extends Record<string, unknown> = Record<string, unknown>,
  ToolOutput extends Record<string, unknown> = Record<string, unknown>,
  ToolResponseMetadata extends Record<string, unknown> = Record<string, unknown>,
  WidgetState extends Record<string, unknown> = Record<string, unknown>
> {
  theme: Theme;
  userAgent: UserAgent;
  locale: string;
  maxHeight: number;
  displayMode: DisplayMode;
  safeArea: SafeArea;
  toolInput: ToolInput;
  toolOutput: ToolOutput | null;
  toolResponseMetadata: ToolResponseMetadata | null;
  widgetState: WidgetState | null;
}

export interface CallToolResponse {
  result: unknown;
}

export interface OpenAiAPI<WidgetState extends Record<string, unknown>> {
  callTool: (name: string, args: Record<string, unknown>) => Promise<CallToolResponse>;
  sendFollowUpMessage: (args: { prompt: string }) => Promise<void>;
  openExternal: (payload: { href: string }) => void;
  requestDisplayMode: (args: { mode: DisplayMode }) => Promise<{ mode: DisplayMode }>;
  setWidgetState: (state: WidgetState) => Promise<void>;
}

export class SetGlobalsEvent extends CustomEventBase<{
  globals: Partial<OpenAiGlobals>;
}> {}

// Extend window interface for OpenAI API
export interface WindowOpenAi extends OpenAiAPI<Record<string, unknown>>, OpenAiGlobals<Record<string, unknown>, Record<string, unknown>, Record<string, unknown>, Record<string, unknown>> {}

declare global {
  interface Window {
    openai?: WindowOpenAi;
  }

  interface WindowEventMap {
    [SET_GLOBALS_EVENT_TYPE]: SetGlobalsEvent;
  }
}

/**
 * Hook para subscrever a um valor específico do window.openai
 * Baseado na documentação oficial: https://developers.openai.com/apps-sdk/build/custom-ux
 */
export function useOpenAiGlobal<K extends keyof OpenAiGlobals>(
  key: K
): OpenAiGlobals[K] | undefined {
  return useSyncExternalStore(
    (onChange) => {
      const handleSetGlobal = (event: SetGlobalsEvent) => {
        const value = event.detail.globals[key];
        if (value === undefined) {
          return;
        }
        onChange();
      };

      window.addEventListener(SET_GLOBALS_EVENT_TYPE, handleSetGlobal);

      return () => {
        window.removeEventListener(SET_GLOBALS_EVENT_TYPE, handleSetGlobal);
      };
    },
    () => globalWindow?.openai?.[key],
    () => undefined // Server-side default
  );
}

/**
 * Hook para acessar toolInput
 */
export function useToolInput<T = Record<string, unknown>>(): T | undefined {
  return useOpenAiGlobal('toolInput') as T | undefined;
}

/**
 * Hook para acessar toolOutput
 */
export function useToolOutput<T = Record<string, unknown>>(): T | null | undefined {
  return useOpenAiGlobal('toolOutput') as T | null | undefined;
}

/**
 * Hook para acessar toolResponseMetadata
 */
export function useToolResponseMetadata<T = Record<string, unknown>>(): T | null | undefined {
  return useOpenAiGlobal('toolResponseMetadata') as T | null | undefined;
}

/**
 * Hook para gerenciar widgetState com sincronização bidirecional
 * Baseado na documentação oficial
 */
export function useWidgetState<T extends Record<string, unknown>>(
  defaultState?: T | (() => T | null) | null
): readonly [T | null, (state: T | null | ((prev: T | null) => T | null)) => void] {
  const widgetStateFromWindow = useOpenAiGlobal('widgetState') as T | null;

  const [widgetState, _setWidgetState] = useState<T | null>(() => {
    if (widgetStateFromWindow != null) {
      return widgetStateFromWindow;
    }

    return typeof defaultState === 'function' ? defaultState() : defaultState ?? null;
  });

  useEffect(() => {
    if (widgetStateFromWindow !== undefined) {
      _setWidgetState(widgetStateFromWindow);
    }
  }, [widgetStateFromWindow]);

  const setWidgetState = useCallback(
    (state: T | null | ((prev: T | null) => T | null)) => {
      _setWidgetState((prevState) => {
        const newState = typeof state === 'function' ? state(prevState) : state;

        if (newState != null && window.openai?.setWidgetState) {
          window.openai.setWidgetState(newState);
        }

        return newState;
      });
    },
    []
  );

  return [widgetState, setWidgetState] as const;
}

/**
 * Hook para acessar o tema atual
 */
export function useTheme(): Theme {
  return useOpenAiGlobal('theme') ?? 'dark';
}

/**
 * Hook para acessar o displayMode atual
 */
export function useDisplayMode(): DisplayMode {
  return useOpenAiGlobal('displayMode') ?? 'inline';
}

/**
 * Hook para acessar maxHeight
 */
export function useMaxHeight(): number {
  return useOpenAiGlobal('maxHeight') ?? 600;
}

/**
 * Hook para acessar o userAgent
 */
export function useUserAgent(): UserAgent | undefined {
  return useOpenAiGlobal('userAgent');
}

/**
 * Hook para acessar safeArea (importante para mobile)
 */
export function useSafeArea(): SafeArea | undefined {
  return useOpenAiGlobal('safeArea');
}


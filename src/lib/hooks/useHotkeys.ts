import { useEffect } from 'react';

interface HotkeyOptions {
  preventDefault?: boolean;
  enableOnFormTags?: boolean;
}

/**
 * Hook simples para keyboard shortcuts
 * Baseado em react-hotkeys-hook mas mais leve
 */
export function useHotkeys(
  keys: string,
  callback: () => void,
  options: HotkeyOptions = {}
) {
  const { preventDefault = true, enableOnFormTags = false } = options;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Parse keys string (e.g., "cmd+shift+p" or "ctrl+shift+p")
      const keyParts = keys.toLowerCase().split('+');
      const key = keyParts.pop(); // Last part is the key
      
      // Check modifiers
      const needsCtrl = keyParts.includes('ctrl') || keyParts.includes('cmd');
      const needsShift = keyParts.includes('shift');
      const needsAlt = keyParts.includes('alt');
      
      // Check if current key combination matches
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlPressed = isMac ? event.metaKey : event.ctrlKey;
      
      const matches = 
        event.key.toLowerCase() === key &&
        (!needsCtrl || ctrlPressed) &&
        (!needsShift || event.shiftKey) &&
        (!needsAlt || event.altKey);

      if (!matches) return;

      // Check if we should ignore form elements
      if (!enableOnFormTags) {
        const target = event.target as HTMLElement;
        const tagName = target.tagName.toLowerCase();
        const isFormElement = ['input', 'textarea', 'select'].includes(tagName);
        const isContentEditable = target.isContentEditable;
        
        if (isFormElement || isContentEditable) return;
      }

      if (preventDefault) {
        event.preventDefault();
      }

      callback();
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [keys, callback, preventDefault, enableOnFormTags]);
}

/**
 * Hook para múltiplos shortcuts
 */
export function useHotkeysMap(
  shortcuts: Record<string, () => void>,
  options: HotkeyOptions = {}
) {
  useEffect(() => {
    const entries = Object.entries(shortcuts);
    
    const cleanup = entries.map(([key, handler]) => {
      useHotkeys(key, handler, options);
      return () => {}; // Cleanup handled by individual useHotkeys
    });

    return () => {
      cleanup.forEach(fn => fn());
    };
  }, [shortcuts, options]);
}
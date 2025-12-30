import { useRef, useCallback, useState } from 'react';

export type SwitchState = 'IDLE' | 'PREPARING' | 'LOADING' | 'APPLYING' | 'FINALIZING';

interface SwitchRequest {
  targetInterval: string;
  resolve: () => void;
  reject: (error: Error) => void;
}

interface TimeframeSwitchControllerOptions {
  onStateChange?: (state: SwitchState) => void;
  onSwitchStart?: (targetInterval: string) => void;
  onSwitchComplete?: (targetInterval: string) => void;
  onSwitchError?: (error: Error) => void;
}

export interface TimeframeSwitchController {
  state: SwitchState;
  isIdle: boolean;
  isSwitching: boolean;
  currentTarget: string | null;
  requestSwitch: (targetInterval: string) => Promise<void>;
  confirmDataReady: () => void;
  confirmApplied: () => void;
  finalize: (completedInterval?: string) => void;
  abort: (reason?: string) => void;
  reset: () => void;
}

export function useTimeframeSwitchController(
  options: TimeframeSwitchControllerOptions = {}
): TimeframeSwitchController {
  const { onStateChange, onSwitchStart, onSwitchComplete, onSwitchError } = options;
  
  const [state, setState] = useState<SwitchState>('IDLE');
  const stateRef = useRef<SwitchState>('IDLE');
  const queueRef = useRef<SwitchRequest[]>([]);
  const currentRequestRef = useRef<SwitchRequest | null>(null);
  const currentTargetRef = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const updateState = useCallback((newState: SwitchState) => {
    stateRef.current = newState;
    setState(newState);
    onStateChange?.(newState);
    console.log(`[TF Controller] State: ${newState}`, currentTargetRef.current ? `(target: ${currentTargetRef.current})` : '');
  }, [onStateChange]);
  
  const processQueue = useCallback(() => {
    if (stateRef.current !== 'IDLE' || queueRef.current.length === 0) {
      return;
    }
    
    const request = queueRef.current.shift()!;
    currentRequestRef.current = request;
    currentTargetRef.current = request.targetInterval;
    
    updateState('PREPARING');
    onSwitchStart?.(request.targetInterval);
    
    timeoutRef.current = setTimeout(() => {
      console.error('[TF Controller] Switch timeout - aborting');
      abort('Timeout');
    }, 10000);
  }, [updateState, onSwitchStart]);
  
  const requestSwitch = useCallback((targetInterval: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (currentTargetRef.current === targetInterval && stateRef.current !== 'IDLE') {
        console.log('[TF Controller] Same interval already switching, skipping');
        resolve();
        return;
      }
      
      if (stateRef.current !== 'IDLE') {
        queueRef.current = queueRef.current.filter(r => r.targetInterval !== targetInterval);
      }
      
      queueRef.current.push({ targetInterval, resolve, reject });
      console.log('[TF Controller] Queued switch to:', targetInterval, 'Queue length:', queueRef.current.length);
      
      if (stateRef.current === 'IDLE') {
        processQueue();
      }
    });
  }, [processQueue]);
  
  const confirmDataReady = useCallback(() => {
    if (stateRef.current !== 'PREPARING') {
      console.warn('[TF Controller] confirmDataReady called in wrong state:', stateRef.current);
      return;
    }
    updateState('LOADING');
  }, [updateState]);
  
  const confirmApplied = useCallback(() => {
    if (stateRef.current !== 'LOADING') {
      console.warn('[TF Controller] confirmApplied called in wrong state:', stateRef.current);
      return;
    }
    updateState('APPLYING');
  }, [updateState]);
  
  const finalize = useCallback((completedInterval?: string) => {
    if (stateRef.current === 'IDLE') {
      console.log('[TF Controller] finalize called in IDLE state - no active switch to finalize');
      return;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    const completedTarget = completedInterval || currentTargetRef.current;
    currentRequestRef.current?.resolve();
    currentRequestRef.current = null;
    currentTargetRef.current = null;
    
    updateState('IDLE');
    onSwitchComplete?.(completedTarget || '');
    
    setTimeout(() => processQueue(), 0);
  }, [updateState, onSwitchComplete, processQueue]);
  
  const abort = useCallback((reason?: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    const error = new Error(reason || 'Switch aborted');
    currentRequestRef.current?.reject(error);
    currentRequestRef.current = null;
    currentTargetRef.current = null;
    
    updateState('IDLE');
    onSwitchError?.(error);
    
    setTimeout(() => processQueue(), 0);
  }, [updateState, onSwitchError, processQueue]);
  
  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    queueRef.current = [];
    currentRequestRef.current = null;
    currentTargetRef.current = null;
    updateState('IDLE');
  }, [updateState]);
  
  return {
    state,
    isIdle: state === 'IDLE',
    isSwitching: state !== 'IDLE',
    currentTarget: currentTargetRef.current,
    requestSwitch,
    confirmDataReady,
    confirmApplied,
    finalize,
    abort,
    reset,
  };
}

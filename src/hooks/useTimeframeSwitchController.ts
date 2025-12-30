import { useRef, useCallback, useState } from 'react';

export type SwitchState = 'IDLE' | 'SWITCHING';

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
  requestSwitch: (targetInterval: string) => void;
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
    
    updateState('SWITCHING');
    onSwitchStart?.(request.targetInterval);
  }, [updateState, onSwitchStart]);
  
  const requestSwitch = useCallback((targetInterval: string): void => {
    // If already switching to same interval, ignore
    if (currentTargetRef.current === targetInterval && stateRef.current !== 'IDLE') {
      console.log('[TF Controller] Same interval already switching, skipping');
      return;
    }
    
    // Remove any pending requests for this interval
    if (stateRef.current !== 'IDLE') {
      queueRef.current = queueRef.current.filter(r => r.targetInterval !== targetInterval);
    }
    
    // Create a simple request (no promise tracking needed for sync usage)
    const request: SwitchRequest = { 
      targetInterval, 
      resolve: () => {}, 
      reject: () => {} 
    };
    
    queueRef.current.push(request);
    console.log('[TF Controller] Queued switch to:', targetInterval, 'Queue length:', queueRef.current.length);
    
    if (stateRef.current === 'IDLE') {
      processQueue();
    }
  }, [processQueue]);
  
  const finalize = useCallback((completedInterval?: string) => {
    if (stateRef.current === 'IDLE') {
      // Already idle, nothing to finalize - this is safe to call
      return;
    }
    
    const completedTarget = completedInterval || currentTargetRef.current;
    console.log('[TF Controller] Finalize:', completedTarget);
    
    currentRequestRef.current?.resolve();
    currentRequestRef.current = null;
    currentTargetRef.current = null;
    
    updateState('IDLE');
    onSwitchComplete?.(completedTarget || '');
    
    // Process next queued switch if any
    setTimeout(() => processQueue(), 0);
  }, [updateState, onSwitchComplete, processQueue]);
  
  const abort = useCallback((reason?: string) => {
    if (stateRef.current === 'IDLE') {
      return;
    }
    
    console.log('[TF Controller] Abort:', reason);
    
    const error = new Error(reason || 'Switch aborted');
    currentRequestRef.current?.reject(error);
    currentRequestRef.current = null;
    currentTargetRef.current = null;
    
    updateState('IDLE');
    onSwitchError?.(error);
    
    // Process next queued switch if any
    setTimeout(() => processQueue(), 0);
  }, [updateState, onSwitchError, processQueue]);
  
  const reset = useCallback(() => {
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
    finalize,
    abort,
    reset,
  };
}

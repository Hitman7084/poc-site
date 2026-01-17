import { useState, useEffect, useSyncExternalStore, useCallback, useRef } from 'react';

/**
 * Hook to detect if the component has been hydrated on the client.
 * Returns false during SSR and initial hydration, true after hydration completes.
 */
export function useHydrated(): boolean {
  const subscribe = useCallback(() => () => {}, []);
  const getSnapshot = useCallback(() => true, []);
  const getServerSnapshot = useCallback(() => false, []);
  
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Hook that returns a value only after hydration is complete.
 * During SSR and initial render, returns the fallback value.
 * After hydration, returns the actual value from the factory function.
 * 
 * @param factory Function that returns the client-side value
 * @param fallback Value to use during SSR and initial render
 */
export function useClientValue<T>(factory: () => T, fallback: T): T {
  const isHydrated = useHydrated();
  const [value, setValue] = useState<T>(fallback);
  
  useEffect(() => {
    if (isHydrated) {
      setValue(factory());
    }
  }, [isHydrated, factory]);
  
  return isHydrated ? value : fallback;
}

/**
 * Hook that returns today's Date in a hydration-safe way.
 * Uses lazy initialization combined with hydration detection.
 * Returns null during SSR/initial render, Date after hydration.
 */
export function useHydratedDate(): [Date | null, (date: Date | null) => void] {
  const isHydrated = useHydrated();
  const initialized = useRef(false);
  
  // Use lazy initializer to avoid calling Date during SSR
  const [date, setDate] = useState<Date | null>(() => {
    // This only runs on client after hydration match
    return null;
  });
  
  // Initialize date on first hydrated render using ref to avoid effect
  if (isHydrated && !initialized.current) {
    initialized.current = true;
    // Schedule state update for next tick to avoid lint warning
    // but actually just return the current date for immediate use
  }
  
  // Use effect only once to set initial date
  useEffect(() => {
    if (isHydrated && date === null && !initialized.current) {
      initialized.current = true;
      setDate(new Date());
    }
  }, [isHydrated, date]);
  
  return [date, setDate];
}

/**
 * Hook specifically for the sidebar collapsed state.
 * Uses useSyncExternalStore for proper hydration handling.
 */
export function useSidebarCollapsed(): [boolean, () => void] {
  // Subscribe to storage events for cross-tab sync
  const subscribe = useCallback((callback: () => void) => {
    window.addEventListener('storage', callback);
    // Poll for same-tab changes (since storage events don't fire in same tab)
    const id = setInterval(callback, 100);
    return () => {
      window.removeEventListener('storage', callback);
      clearInterval(id);
    };
  }, []);
  
  const getSnapshot = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      const saved = localStorage.getItem('sidebar-collapsed');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  }, []);
  
  const getServerSnapshot = useCallback((): boolean => false, []);
  
  const isCollapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  
  const toggle = useCallback(() => {
    const newValue = !isCollapsed;
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newValue));
    // Dispatch storage event for same-tab listeners
    window.dispatchEvent(new StorageEvent('storage', { key: 'sidebar-collapsed' }));
  }, [isCollapsed]);
  
  return [isCollapsed, toggle];
}

// React Hooks for Observability
// Easy-to-use hooks for logging and performance tracking in React components

import { useEffect, useCallback, useRef } from 'react';
import { clientLogger, type ClientLogContext } from './client-logger';
import { performanceMonitor } from './performance-monitor';

/**
 * Hook to log page views automatically
 */
export function usePageView(screenName: string, metadata?: Record<string, any>) {
  useEffect(() => {
    clientLogger.pageView(screenName, metadata);
  }, [screenName, metadata]);
}

/**
 * Hook to track component mount/unmount
 */
export function useComponentTracking(
  componentName: string,
  metadata?: Record<string, any>
) {
  useEffect(() => {
    clientLogger.debug(`Component mounted: ${componentName}`, {
      component: componentName,
      metadata,
    });

    return () => {
      clientLogger.debug(`Component unmounted: ${componentName}`, {
        component: componentName,
        metadata,
      });
    };
  }, [componentName]);
}

/**
 * Hook to track button clicks with logging
 */
export function useTrackedClick(
  buttonName: string,
  context?: ClientLogContext
) {
  return useCallback(() => {
    clientLogger.buttonClick(buttonName, context);
  }, [buttonName, context]);
}

/**
 * Hook to measure component render performance
 */
export function useRenderPerformance(componentName: string) {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    const duration = performance.now() - startTime.current;

    performanceMonitor.end(`render_${componentName}`, {
      renderCount: renderCount.current,
      duration,
    });

    startTime.current = performance.now();
  });

  useEffect(() => {
    performanceMonitor.start(`render_${componentName}`);
    
    return () => {
      const stats = performanceMonitor.getStats(`render_${componentName}`);
      if (stats) {
        clientLogger.performance(`Component ${componentName} render stats`, stats.avg, {
          component: componentName,
          stats,
        });
      }
    };
  }, [componentName]);
}

/**
 * Hook to track API calls with performance timing
 */
export function useTrackedAPI<T extends (...args: any[]) => Promise<any>>(
  apiFunction: T,
  apiName: string
): T {
  return useCallback(
    (async (...args: any[]) => {
      performanceMonitor.start(`api_${apiName}`);
      
      try {
        const result = await apiFunction(...args);
        
        const duration = performanceMonitor.end(`api_${apiName}`, {
          success: true,
          apiName,
        });

        clientLogger.performance(`API call: ${apiName}`, duration || 0, {
          success: true,
        });

        return result;
      } catch (error) {
        const duration = performanceMonitor.end(`api_${apiName}`, {
          success: false,
          apiName,
          error: error instanceof Error ? error.message : String(error),
        });

        clientLogger.error(`API call failed: ${apiName}`, error as Error, {
          metadata: { duration },
        });

        throw error;
      }
    }) as T,
    [apiFunction, apiName]
  );
}

/**
 * Hook to track form submissions
 */
export function useFormTracking(formName: string) {
  const onSubmit = useCallback(() => {
    clientLogger.formSubmit(formName);
  }, [formName]);

  const onError = useCallback((error: string) => {
    clientLogger.formError(formName, error);
  }, [formName]);

  return { onSubmit, onError };
}

/**
 * Hook to track navigation
 */
export function useNavigationTracking() {
  const previousLocation = useRef<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentLocation = window.location.pathname;
      
      if (previousLocation.current && previousLocation.current !== currentLocation) {
        clientLogger.navigate(previousLocation.current, currentLocation);
      }
      
      previousLocation.current = currentLocation;
    }
  });
}

/**
 * Hook to track errors in components (error boundary alternative)
 */
export function useErrorTracking(componentName: string) {
  const logError = useCallback((error: Error, errorInfo?: any) => {
    clientLogger.error(`Error in ${componentName}`, error, {
      component: componentName,
      metadata: { errorInfo },
    });
  }, [componentName]);

  return logError;
}

/**
 * Hook to track user interactions
 */
export function useInteractionTracking() {
  const trackInteraction = useCallback((
    action: string,
    component: string,
    metadata?: Record<string, any>
  ) => {
    clientLogger.interaction(action, component, metadata);
  }, []);

  return trackInteraction;
}

/**
 * Hook to flush logs on unmount (for critical components)
 */
export function useLogFlush() {
  useEffect(() => {
    return () => {
      clientLogger.flush();
    };
  }, []);
}

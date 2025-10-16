/**
 * Debounce utility for optimizing search and input performance
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay (default: 500ms)
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 500
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };
}

/**
 * Creates a debounced async function with cancel support
 * @param func - The async function to debounce
 * @param wait - The number of milliseconds to delay (default: 500ms)
 * @returns Debounced async function with cancel method
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  func: T,
  wait: number = 500
): ((...args: Parameters<T>) => Promise<ReturnType<T>>) & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null;
  let latestResolve: ((value: any) => void) | null = null;
  let latestReject: ((reason?: any) => void) | null = null;

  const debounced = function (...args: Parameters<T>): Promise<ReturnType<T>> {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Reject previous pending promise
    if (latestReject) {
      latestReject(new Error('Debounced call cancelled'));
    }

    return new Promise<ReturnType<T>>((resolve, reject) => {
      latestResolve = resolve;
      latestReject = reject;

      timeoutId = setTimeout(async () => {
        try {
          const result = await func(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          timeoutId = null;
          latestResolve = null;
          latestReject = null;
        }
      }, wait);
    });
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (latestReject) {
      latestReject(new Error('Debounced call cancelled'));
      latestReject = null;
      latestResolve = null;
    }
  };

  return debounced;
}

/**
 * Creates a throttled function that only invokes func at most once per wait milliseconds
 * @param func - The function to throttle
 * @param wait - The number of milliseconds to throttle (default: 500ms)
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 500
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastRun: number = 0;

  return function throttled(...args: Parameters<T>) {
    const now = Date.now();

    if (now - lastRun >= wait) {
      func(...args);
      lastRun = now;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        func(...args);
        lastRun = Date.now();
        timeoutId = null;
      }, wait - (now - lastRun));
    }
  };
}

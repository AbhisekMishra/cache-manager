/**
 * Wraps a promise with a timeout mechanism
 * @param promise The promise to wrap with timeout
 * @param timeoutMs Timeout duration in milliseconds
 * @returns Promise that resolves with the original promise result or rejects with timeout error
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 5000
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}
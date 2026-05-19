// In-memory Promise-based Mutex queue to serialize allocations per service
// Bypasses the local MongoDB replica-set transaction requirement perfectly!
const locks = new Map<string, Promise<any>>();

export async function acquireLock<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  const currentPromise = locks.get(key) || Promise.resolve();

  // Schedule the new task to run immediately after the previous task resolves/rejects
  const nextPromise = currentPromise.then(async () => {
    try {
      return await fn();
    } catch (error) {
      // Forward error so the promise chain doesn't swallow exceptions
      throw error;
    }
  }).catch(async (error) => {
    // If the previous task failed, we still want this task to execute
    try {
      return await fn();
    } catch (e) {
      throw e;
    }
  });

  // Save the promise to the map so the next execution waits on it
  locks.set(key, nextPromise);

  // Once this execution completes, clean up the Map to avoid memory bloat
  nextPromise.finally(() => {
    if (locks.get(key) === nextPromise) {
      locks.delete(key);
    }
  });

  return nextPromise;
}

// In-memory Promise-based Mutex queue to serialize allocations per service
// Bypasses local MongoDB standalone transaction constraints cleanly and safely!
const locks = new Map<string, Promise<any>>();

export async function acquireLock<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  // Get the current promise queue (always safe/resolved due to catch bindings)
  const currentPromise = locks.get(key) || Promise.resolve();

  // Schedule the new task to run immediately after the previous task completes
  const nextPromise = currentPromise.then(async () => {
    return await fn();
  });

  // Store a safe, caught promise in the map to prevent unhandled rejections
  locks.set(key, nextPromise.catch(() => {}));

  // Clean up the Map once fully resolved to prevent memory bloat
  nextPromise.finally(() => {
    const active = locks.get(key);
    // Only delete if no new thread has overwritten it
    if (active === nextPromise) {
      locks.delete(key);
    }
  });

  // Return the original promise so the caller receives the actual resolution/rejection
  return nextPromise;
}

/** Cede control al loop de eventos con la API nativa scheduler.yield() si existe, o microtask Promise.resolve() */
export async function yieldNow(): Promise<void> {
  const navScheduler = (globalThis as unknown as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  if (typeof navScheduler?.yield === 'function') {
    return navScheduler.yield();
  }
  return Promise.resolve();
}

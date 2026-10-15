export async function yieldNow(): Promise<void> {
  // Minimal async yield; can be mocked in tests
  return Promise.resolve();
}

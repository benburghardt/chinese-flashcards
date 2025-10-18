// Centralized environment detection utility
// Used to determine if we're running in Tauri desktop app or web browser

let environmentCache: 'desktop' | 'web' | null = null;

export const detectEnvironment = async (): Promise<'desktop' | 'web'> => {
  // Return cached result if available
  if (environmentCache) {
    return environmentCache;
  }

  try {
    // Try to import Tauri APIs
    await import('@tauri-apps/plugin-dialog');
    environmentCache = 'desktop';
    return 'desktop';
  } catch {
    environmentCache = 'web';
    return 'web';
  }
};

export const isDesktop = async (): Promise<boolean> => {
  const env = await detectEnvironment();
  return env === 'desktop';
};

export const isWeb = async (): Promise<boolean> => {
  const env = await detectEnvironment();
  return env === 'web';
};

// Synchronous version that uses cached result
// Only use after detectEnvironment() has been called at least once
export const getEnvironmentSync = (): 'desktop' | 'web' | null => {
  return environmentCache;
};
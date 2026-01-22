// Stub for @sentry/nextjs to avoid Next.js dependencies in Vite app
// This provides no-op implementations for Sentry functions used by @repo/observability

export const captureException = (error: unknown) => {
  // In development, you might want to log to console
  if (import.meta.env.DEV) {
    console.error('[Sentry Stub] Exception:', error);
  }
};

export const captureMessage = (message: string) => {
  if (import.meta.env.DEV) {
    console.log('[Sentry Stub] Message:', message);
  }
};

// Add other Sentry methods as needed
export const setUser = () => {};
export const setTag = () => {};
export const setContext = () => {};
export const addBreadcrumb = () => {};
export const configureScope = () => {};

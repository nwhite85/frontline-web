/**
 * Centralized logging utility for Next.js app
 * 
 * Only logs in development mode
 * Can be extended with external services (Sentry, LogRocket) in production
 */

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * General logging - development only
   */
  log: (...args: unknown[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Error logging - always logged (can send to error tracking)
   */
  error: (...args: unknown[]) => {
    console.error(...args);
    // TODO: Send to Sentry/error tracking in production
  },

  /**
   * Warning logging - development only
   */
  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Info logging - development only
   */
  info: (...args: unknown[]) => {
    if (isDev) {
      console.info(...args);
    }
  },

  /**
   * Debug logging - development only
   */
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },
};

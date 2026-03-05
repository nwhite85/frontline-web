import { logger } from './logger';

/**
 * Extract error message from an unknown caught value
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error';
};

/**
 * Standard error handler for async operations
 * Logs error and optionally shows user-friendly message
 */
export const handleAsyncError = (
  error: unknown,
  context: string,
  userMessage?: string
): string => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  
  logger.error(`[${context}] Error:`, error);
  
  return userMessage || errorMessage;
};

/**
 * Wrapper for async operations with automatic error handling
 */
export const tryCatch = async <T>(
  operation: () => Promise<T>,
  context: string,
  fallback?: T
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    handleAsyncError(error, context);
    return fallback ?? null;
  }
};

/**
 * Supabase error handler - extracts meaningful error messages
 */
export const handleSupabaseError = (error: unknown, context: string): string => {
  let message = 'An error occurred';
  
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'object' && error !== null && 'error_description' in error) {
    message = String((error as { error_description: unknown }).error_description);
  } else if (typeof error === 'string') {
    message = error;
  }
  
  logger.error(`[Supabase][${context}]`, error);
  
  return message;
};

/**
 * Standard error response for API routes
 */
export const apiError = (
  error: unknown,
  context: string,
  status: number = 500
) => {
  const message = error instanceof Error ? error.message : 'Internal server error';
  logger.error(`[API][${context}]`, error);
  
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { 'Content-Type': 'application/json' } }
  );
};

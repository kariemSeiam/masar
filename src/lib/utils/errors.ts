// Error handling utilities

/**
 * Handles errors consistently across the application
 * @param error - The error to handle
 * @param context - Context where the error occurred (e.g., 'UserContext', 'LoginScreen')
 * @param showToUser - Whether to show the error to the user (future: integrate with toast system)
 */
export function handleError(error: unknown, context: string, showToUser = false): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${context}]`, message);
  
  // TODO: Integrate with toast/notification system when available
  if (showToUser && typeof window !== 'undefined') {
    // Could use a toast library like sonner here
    // toast.error(message);
  }
}


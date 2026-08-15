// Clipboard utility functions

/**
 * Copies text to clipboard with optional success/error callbacks
 */
export async function copyToClipboard(
  text: string,
  onSuccess?: () => void,
  onError?: (error: Error) => void
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    onSuccess?.();
    return true;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Failed to copy:', err);
    onError?.(err);
    return false;
  }
}


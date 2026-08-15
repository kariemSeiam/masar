'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { copyToClipboard } from '@/lib/utils/clipboard';
import { COPY_FEEDBACK_DURATION } from '@/lib/constants/timing';

/**
 * Hook for copying text to clipboard with visual feedback
 * @param duration - Duration in milliseconds to show the "copied" state (default: 2000ms)
 */
export function useCopyToClipboard(duration = COPY_FEEDBACK_DURATION) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const copy = useCallback(async (text: string) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
        timeoutRef.current = null;
      }, duration);
    }
    return success;
  }, [duration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { copied, copy };
}


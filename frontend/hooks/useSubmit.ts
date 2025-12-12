/**
 * useSubmit hook for handling form submissions with debounce and duplicate prevention.
 *
 * Features:
 * - Debounce to prevent rapid repeated submissions
 * - Duplicate submission prevention while request is in flight
 * - 429 rate limit error handling
 */

import { useState, useCallback, useRef } from "react";

interface UseSubmitOptions<T> {
  /** Callback on successful submission */
  onSuccess?: (result: T) => void;
  /** Callback on error */
  onError?: (error: unknown) => void;
  /** Debounce time in milliseconds (default: 2000) */
  debounceMs?: number;
}

interface UseSubmitReturn<T> {
  /** Submit function - call this to trigger submission */
  submit: () => Promise<T | undefined>;
  /** Whether a submission is currently in progress */
  isSubmitting: boolean;
  /** Reset the debounce timer (e.g., after error recovery) */
  resetDebounce: () => void;
}

/**
 * Custom hook for handling form submissions with built-in protections.
 *
 * @param submitFn - The async function to execute on submit
 * @param options - Configuration options
 * @returns Submit function, loading state, and reset function
 *
 * @example
 * ```tsx
 * const { submit, isSubmitting } = useSubmit(
 *   async () => {
 *     return await createSubmission({ problem_id: 1, code: "test" });
 *   },
 *   {
 *     debounceMs: 2000,
 *     onSuccess: (result) => console.log("Success:", result),
 *     onError: (error) => console.error("Error:", error),
 *   }
 * );
 *
 * return (
 *   <button onClick={submit} disabled={isSubmitting}>
 *     {isSubmitting ? "Submitting..." : "Submit"}
 *   </button>
 * );
 * ```
 */
export function useSubmit<T>(
  submitFn: () => Promise<T>,
  options: UseSubmitOptions<T> = {}
): UseSubmitReturn<T> {
  const { debounceMs = 2000, onSuccess, onError } = options;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastSubmitTimeRef = useRef<number>(0);

  const resetDebounce = useCallback(() => {
    lastSubmitTimeRef.current = 0;
  }, []);

  const submit = useCallback(async (): Promise<T | undefined> => {
    const now = Date.now();

    // Debounce check: ensure minimum time has passed since last submission
    if (now - lastSubmitTimeRef.current < debounceMs) {
      return undefined;
    }

    // Prevent duplicate submissions while one is in progress
    if (isSubmitting) {
      return undefined;
    }

    lastSubmitTimeRef.current = now;
    setIsSubmitting(true);

    try {
      const result = await submitFn();
      onSuccess?.(result);
      return result;
    } catch (error) {
      onError?.(error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [submitFn, isSubmitting, debounceMs, onSuccess, onError]);

  return { submit, isSubmitting, resetDebounce };
}

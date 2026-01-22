'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'ai_verifier_onboarding';
const CURRENT_VERSION = 1;

interface OnboardingState {
  completed: boolean;
  version: number;
  lastVisit: number;
  consecutiveFailures: number;
}

export type OnboardingType = 'full' | 'reminder' | 'feature' | 'hint' | null;

function getStoredState(): OnboardingState | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parsing errors
  }
  return null;
}

function saveState(state: OnboardingState): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

function determineOnboardingType(state: OnboardingState | null): OnboardingType {
  // First visit - show full onboarding
  if (!state || !state.completed) {
    return 'full';
  }

  // 7 days inactive - show reminder
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  if (state.lastVisit < sevenDaysAgo) {
    return 'reminder';
  }

  // New version - show feature update
  if (state.version < CURRENT_VERSION) {
    return 'feature';
  }

  // 3+ consecutive failures - show hint
  if (state.consecutiveFailures >= 3) {
    return 'hint';
  }

  return null;
}

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingType, setOnboardingType] = useState<OnboardingType>(null);
  const [state, setState] = useState<OnboardingState | null>(null);

  // Initialize on mount
  useEffect(() => {
    const stored = getStoredState();
    setState(stored);

    const type = determineOnboardingType(stored);
    setOnboardingType(type);

    // Show onboarding if needed (only for 'full' type automatically)
    if (type === 'full') {
      setShowOnboarding(true);
    }

    // Update last visit
    if (stored) {
      const updated = { ...stored, lastVisit: Date.now() };
      saveState(updated);
      setState(updated);
    }
  }, []);

  const completeOnboarding = useCallback(() => {
    const newState: OnboardingState = {
      completed: true,
      version: CURRENT_VERSION,
      lastVisit: Date.now(),
      consecutiveFailures: 0,
    };
    saveState(newState);
    setState(newState);
    setShowOnboarding(false);
    setOnboardingType(null);
  }, []);

  const skipOnboarding = useCallback(() => {
    // Still mark as completed, just track that they skipped
    completeOnboarding();
  }, [completeOnboarding]);

  const recordFailure = useCallback(() => {
    if (!state) return;

    const newState = {
      ...state,
      consecutiveFailures: state.consecutiveFailures + 1,
    };
    saveState(newState);
    setState(newState);

    // Check if we should show hint
    if (newState.consecutiveFailures >= 3) {
      setOnboardingType('hint');
    }
  }, [state]);

  const recordSuccess = useCallback(() => {
    if (!state) return;

    const newState = {
      ...state,
      consecutiveFailures: 0,
    };
    saveState(newState);
    setState(newState);
    setOnboardingType(null);
  }, [state]);

  const dismissHint = useCallback(() => {
    if (!state) return;

    // Reset consecutive failures
    const newState = {
      ...state,
      consecutiveFailures: 0,
    };
    saveState(newState);
    setState(newState);
    setOnboardingType(null);
    setShowOnboarding(false);
  }, [state]);

  return {
    showOnboarding,
    onboardingType,
    completeOnboarding,
    skipOnboarding,
    recordFailure,
    recordSuccess,
    dismissHint,
    setShowOnboarding,
  };
}

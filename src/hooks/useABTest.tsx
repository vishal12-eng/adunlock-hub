import { useState, useEffect, useCallback } from 'react';

export type ABTestVariant = 'control' | 'variant_a' | 'variant_b' | 'variant_c';

interface ABTest {
  id: string;
  name: string;
  variants: ABTestVariant[];
  weights?: number[]; // Optional weights for each variant
}

interface ABTestResult {
  testId: string;
  variant: ABTestVariant;
  impressions: number;
  conversions: number;
  conversionRate: number;
}

interface ABTestEvent {
  testId: string;
  variant: ABTestVariant;
  event: 'impression' | 'conversion';
  timestamp: number;
}

const STORAGE_KEY = 'adnexus_ab_tests';
const EVENTS_KEY = 'adnexus_ab_events';

// Get user's assigned variant for a test
function getAssignedVariant(testId: string): ABTestVariant | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const assignments = JSON.parse(stored);
    return assignments[testId] || null;
  } catch {
    return null;
  }
}

// Assign a variant to a user for a test
function assignVariant(test: ABTest): ABTestVariant {
  const existing = getAssignedVariant(test.id);
  if (existing) return existing;

  // Weighted random selection
  const weights = test.weights || test.variants.map(() => 1 / test.variants.length);
  const random = Math.random();
  let cumulative = 0;
  let selectedVariant = test.variants[0];

  for (let i = 0; i < test.variants.length; i++) {
    cumulative += weights[i];
    if (random <= cumulative) {
      selectedVariant = test.variants[i];
      break;
    }
  }

  // Store assignment
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const assignments = stored ? JSON.parse(stored) : {};
    assignments[test.id] = selectedVariant;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
  } catch (e) {
    console.error('Failed to store A/B test assignment:', e);
  }

  return selectedVariant;
}

// Track an event for a test
function trackEvent(testId: string, variant: ABTestVariant, event: 'impression' | 'conversion') {
  try {
    const stored = localStorage.getItem(EVENTS_KEY);
    const events: ABTestEvent[] = stored ? JSON.parse(stored) : [];
    
    events.push({
      testId,
      variant,
      event,
      timestamp: Date.now(),
    });

    // Keep only last 1000 events to prevent storage bloat
    const trimmedEvents = events.slice(-1000);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(trimmedEvents));
  } catch (e) {
    console.error('Failed to track A/B test event:', e);
  }
}

// Get results for all tests
export function getABTestResults(): ABTestResult[] {
  try {
    const stored = localStorage.getItem(EVENTS_KEY);
    if (!stored) return [];
    
    const events: ABTestEvent[] = JSON.parse(stored);
    const results: Record<string, Record<ABTestVariant, { impressions: number; conversions: number }>> = {};

    events.forEach(event => {
      if (!results[event.testId]) {
        results[event.testId] = {} as Record<ABTestVariant, { impressions: number; conversions: number }>;
      }
      if (!results[event.testId][event.variant]) {
        results[event.testId][event.variant] = { impressions: 0, conversions: 0 };
      }

      if (event.event === 'impression') {
        results[event.testId][event.variant].impressions++;
      } else {
        results[event.testId][event.variant].conversions++;
      }
    });

    const finalResults: ABTestResult[] = [];
    Object.entries(results).forEach(([testId, variants]) => {
      Object.entries(variants).forEach(([variant, data]) => {
        finalResults.push({
          testId,
          variant: variant as ABTestVariant,
          impressions: data.impressions,
          conversions: data.conversions,
          conversionRate: data.impressions > 0 ? (data.conversions / data.impressions) * 100 : 0,
        });
      });
    });

    return finalResults;
  } catch {
    return [];
  }
}

// Clear all A/B test data
export function clearABTestData() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(EVENTS_KEY);
}

// Predefined tests
export const AB_TESTS = {
  CTA_BUTTON_TEXT: {
    id: 'cta_button_text',
    name: 'CTA Button Text',
    variants: ['control', 'variant_a', 'variant_b'] as ABTestVariant[],
    values: {
      control: 'Click to unlock',
      variant_a: 'Unlock Now',
      variant_b: 'Get Access',
    },
  },
  CTA_BUTTON_COLOR: {
    id: 'cta_button_color',
    name: 'CTA Button Color',
    variants: ['control', 'variant_a', 'variant_b'] as ABTestVariant[],
    values: {
      control: 'default', // Uses default primary color
      variant_a: 'gradient', // Uses gradient
      variant_b: 'accent', // Uses accent color
    },
  },
  CARD_LAYOUT: {
    id: 'card_layout',
    name: 'Card Layout Style',
    variants: ['control', 'variant_a'] as ABTestVariant[],
    values: {
      control: 'standard',
      variant_a: 'compact',
    },
  },
  URGENCY_DISPLAY: {
    id: 'urgency_display',
    name: 'Urgency Timer Display',
    variants: ['control', 'variant_a', 'variant_b'] as ABTestVariant[],
    values: {
      control: 'countdown', // Shows countdown timer
      variant_a: 'spots_left', // Shows "X spots left"
      variant_b: 'hidden', // No urgency element
    },
  },
  FEATURED_SECTION: {
    id: 'featured_section',
    name: 'Featured Section Position',
    variants: ['control', 'variant_a'] as ABTestVariant[],
    values: {
      control: 'top', // Featured at top
      variant_a: 'integrated', // Featured mixed with regular content
    },
  },
} as const;

// Hook for using A/B tests
export function useABTest<T extends keyof typeof AB_TESTS>(testKey: T) {
  const test = AB_TESTS[testKey];
  const [variant, setVariant] = useState<ABTestVariant>('control');
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);

  useEffect(() => {
    const assignedVariant = assignVariant({
      id: test.id,
      name: test.name,
      variants: [...test.variants],
    });
    setVariant(assignedVariant);
  }, [test.id, test.name, test.variants]);

  // Track impression (only once per page load)
  const trackImpression = useCallback(() => {
    if (!hasTrackedImpression) {
      trackEvent(test.id, variant, 'impression');
      setHasTrackedImpression(true);
    }
  }, [test.id, variant, hasTrackedImpression]);

  // Track conversion
  const trackConversion = useCallback(() => {
    trackEvent(test.id, variant, 'conversion');
  }, [test.id, variant]);

  // Get the value for the current variant
  const value = test.values[variant as keyof typeof test.values] || test.values.control;

  return {
    variant,
    value,
    trackImpression,
    trackConversion,
    testId: test.id,
    testName: test.name,
  };
}

// Hook for getting all test results
export function useABTestResults() {
  const [results, setResults] = useState<ABTestResult[]>([]);

  useEffect(() => {
    setResults(getABTestResults());
  }, []);

  const refresh = useCallback(() => {
    setResults(getABTestResults());
  }, []);

  return { results, refresh, clearData: clearABTestData };
}

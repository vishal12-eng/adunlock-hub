import { useState, useEffect, useCallback } from 'react';

interface RatingData {
  rating: number;
  ratedAt: string;
}

interface RatingsStore {
  [contentId: string]: RatingData;
}

const RATINGS_KEY = 'content_ratings';

function loadRatings(): RatingsStore {
  try {
    const stored = localStorage.getItem(RATINGS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveRatings(ratings: RatingsStore): void {
  try {
    localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
  } catch {
    console.warn('Failed to save ratings to localStorage');
  }
}

export function useRatings(contentId?: string) {
  const [ratings, setRatings] = useState<RatingsStore>(loadRatings);
  const [userRating, setUserRating] = useState<number>(0);

  useEffect(() => {
    if (contentId && ratings[contentId]) {
      setUserRating(ratings[contentId].rating);
    } else {
      setUserRating(0);
    }
  }, [contentId, ratings]);

  const rateContent = useCallback((id: string, rating: number) => {
    if (rating < 1 || rating > 5) return;
    
    const newRatings = {
      ...ratings,
      [id]: {
        rating,
        ratedAt: new Date().toISOString()
      }
    };
    
    setRatings(newRatings);
    saveRatings(newRatings);
    
    if (id === contentId) {
      setUserRating(rating);
    }
  }, [ratings, contentId]);

  const getRating = useCallback((id: string): number => {
    return ratings[id]?.rating || 0;
  }, [ratings]);

  const hasRated = useCallback((id: string): boolean => {
    return !!ratings[id];
  }, [ratings]);

  return {
    userRating,
    rateContent,
    getRating,
    hasRated,
    allRatings: ratings
  };
}

// Calculate aggregate rating from all users who rated this content
// This simulates what would happen with a real database by using localStorage
// and combining with a realistic base rating
export function getAggregateRating(contentId: string, views: number, unlocks: number): { 
  rating: string; 
  hasUserRating: boolean;
  totalRatings: number;
  userRating: number | null;
} {
  const ratings = loadRatings();
  const userRatingData = ratings[contentId];
  const userRating = userRatingData?.rating || null;
  
  // Generate a consistent pseudo-random base rating and count based on content ID
  let hash = 0;
  for (let i = 0; i < contentId.length; i++) {
    const char = contentId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Base rating between 3.8 and 4.9 based on hash
  const baseRating = 3.8 + (Math.abs(hash % 11) / 10);
  
  // Simulated number of ratings based on unlocks (more unlocks = more ratings)
  const simulatedRatingCount = Math.min(Math.floor(unlocks * 0.3) + Math.abs(hash % 50), 9999);
  
  // Popularity bonus based on unlock rate
  const popularityBonus = Math.min(0.3, (unlocks / Math.max(views, 1)) * 0.5);
  
  // Calculate aggregate: if user has rated, blend their rating into the "average"
  let finalRating: number;
  let totalRatings: number;
  
  if (userRating) {
    // Blend user rating with simulated average (weighted by count)
    const totalWeight = simulatedRatingCount + 1;
    const simulatedSum = baseRating * simulatedRatingCount;
    finalRating = (simulatedSum + userRating) / totalWeight;
    totalRatings = simulatedRatingCount + 1;
  } else {
    finalRating = baseRating + popularityBonus;
    totalRatings = simulatedRatingCount;
  }
  
  finalRating = Math.min(5, Math.max(1, finalRating));
  
  return { 
    rating: finalRating.toFixed(1), 
    hasUserRating: !!userRating,
    totalRatings,
    userRating
  };
}

// Legacy function for backward compatibility
export function getDisplayRating(contentId: string, views: number, unlocks: number): { rating: string; hasUserRating: boolean } {
  const { rating, hasUserRating } = getAggregateRating(contentId, views, unlocks);
  return { rating, hasUserRating };
}

// Format rating count for display (e.g., 1.2K, 500)
export function formatRatingCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

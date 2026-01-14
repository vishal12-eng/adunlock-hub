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

// Generate a display rating that combines user rating with a realistic base
export function getDisplayRating(contentId: string, views: number, unlocks: number): { rating: string; hasUserRating: boolean } {
  const ratings = loadRatings();
  const userRating = ratings[contentId]?.rating;
  
  if (userRating) {
    return { rating: userRating.toFixed(1), hasUserRating: true };
  }
  
  // Generate a consistent pseudo-random rating based on content ID
  // This ensures the same content always shows the same rating
  let hash = 0;
  for (let i = 0; i < contentId.length; i++) {
    const char = contentId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Base rating between 3.8 and 4.9 based on hash
  const baseRating = 3.8 + (Math.abs(hash % 11) / 10);
  
  // Slight adjustment based on popularity
  const popularityBonus = Math.min(0.3, (unlocks / Math.max(views, 1)) * 0.5);
  
  const finalRating = Math.min(5, baseRating + popularityBonus);
  
  return { rating: finalRating.toFixed(1), hasUserRating: false };
}

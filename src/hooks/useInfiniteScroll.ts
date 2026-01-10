import { useState, useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number;
  initialPageSize?: number;
  pageSize?: number;
}

export function useInfiniteScroll<T>(
  items: T[],
  options: UseInfiniteScrollOptions = {}
) {
  const { 
    threshold = 200, 
    initialPageSize = 12,
    pageSize = 8 
  } = options;
  
  const [displayCount, setDisplayCount] = useState(initialPageSize);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const displayedItems = items.slice(0, displayCount);
  const hasMore = displayCount < items.length;

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    // Simulate loading delay for smooth UX
    setTimeout(() => {
      setDisplayCount(prev => Math.min(prev + pageSize, items.length));
      setIsLoadingMore(false);
    }, 300);
  }, [isLoadingMore, hasMore, pageSize, items.length]);

  // Reset when items change (e.g., filter/search)
  useEffect(() => {
    setDisplayCount(initialPageSize);
  }, [items.length, initialPageSize]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { rootMargin: `${threshold}px` }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, isLoadingMore, loadMore, threshold]);

  return {
    displayedItems,
    hasMore,
    isLoadingMore,
    loadMoreRef,
    loadMore,
    totalCount: items.length,
    displayedCount: displayedItems.length,
  };
}

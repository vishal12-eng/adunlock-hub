import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRate?: (rating: number) => void;
  showValue?: boolean;
  className?: string;
}

export function RatingStars({
  rating,
  maxRating = 5,
  size = 'sm',
  interactive = false,
  onRate,
  showValue = true,
  className
}: RatingStarsProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  function handleClick(starIndex: number) {
    if (interactive && onRate) {
      onRate(starIndex + 1);
    }
  }

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {showValue && (
        <span className={cn("font-medium text-foreground mr-1", textSizeClasses[size])}>
          {rating.toFixed(1)}
        </span>
      )}
      {Array.from({ length: maxRating }).map((_, index) => {
        const filled = index < Math.floor(rating);
        const partial = index === Math.floor(rating) && rating % 1 > 0;
        const fillPercent = partial ? (rating % 1) * 100 : 0;

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleClick(index)}
            disabled={!interactive}
            className={cn(
              "relative transition-transform",
              interactive && "cursor-pointer hover:scale-110 active:scale-95",
              !interactive && "cursor-default"
            )}
          >
            {/* Background star (empty) */}
            <Star 
              className={cn(
                sizeClasses[size],
                "text-muted-foreground/30"
              )} 
            />
            
            {/* Filled star overlay */}
            {(filled || partial) && (
              <Star 
                className={cn(
                  sizeClasses[size],
                  "absolute inset-0 text-yellow-400 fill-yellow-400"
                )}
                style={partial ? { 
                  clipPath: `inset(0 ${100 - fillPercent}% 0 0)` 
                } : undefined}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

interface InteractiveRatingProps {
  contentId: string;
  currentRating: number;
  onRate: (contentId: string, rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function InteractiveRating({
  contentId,
  currentRating,
  onRate,
  size = 'md',
  className
}: InteractiveRatingProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-xs text-muted-foreground">
        {currentRating > 0 ? 'Your rating:' : 'Rate this app:'}
      </span>
      <RatingStars
        rating={currentRating}
        size={size}
        interactive
        onRate={(rating) => onRate(contentId, rating)}
        showValue={currentRating > 0}
      />
    </div>
  );
}

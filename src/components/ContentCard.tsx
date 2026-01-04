import { useState, useEffect } from 'react';
import { Lock, Eye, Download, Flame, Clock, Sparkles } from 'lucide-react';

interface ContentCardProps {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  requiredAds: number;
  views: number;
  unlocks: number;
  onClick: () => void;
}

function getRandomCountdown() {
  // Random countdown between 5-30 minutes for urgency
  const stored = sessionStorage.getItem('countdown_offsets');
  const offsets = stored ? JSON.parse(stored) : {};
  return offsets;
}

function getTrendingBadge(views: number, unlocks: number) {
  if (views >= 100 || unlocks >= 50) return { label: '🔥 Hot', color: 'bg-destructive/80 text-destructive-foreground' };
  if (views >= 50 || unlocks >= 20) return { label: '⚡ Trending', color: 'bg-primary/80 text-primary-foreground' };
  if (unlocks >= 10) return { label: '✨ Popular', color: 'bg-accent/80 text-accent-foreground' };
  return null;
}

export function ContentCard({
  id,
  title,
  description,
  thumbnailUrl,
  requiredAds,
  views,
  unlocks,
  onClick
}: ContentCardProps) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const trendingBadge = getTrendingBadge(views, unlocks);

  useEffect(() => {
    // Get or set random countdown for this card
    const offsets = getRandomCountdown();
    if (!offsets[id]) {
      offsets[id] = Math.floor(Math.random() * 25) + 5; // 5-30 minutes
      sessionStorage.setItem('countdown_offsets', JSON.stringify(offsets));
    }
    setCountdown(offsets[id] * 60); // Convert to seconds
  }, [id]);

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    onClick();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  }

  function formatCountdown(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  return (
    <div 
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="content-card rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer group"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
            <Lock className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-80" />
        
        {/* Trending Badge */}
        {trendingBadge && (
          <div className={`absolute top-2 sm:top-3 left-2 sm:left-3 flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold ${trendingBadge.color}`}>
            {trendingBadge.label}
          </div>
        )}

        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 glass rounded-full">
          <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
          <span className="text-[10px] sm:text-xs font-semibold text-primary">{requiredAds} Ads</span>
        </div>
        
        <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
            <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{views}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
            <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{unlocks}</span>
          </div>
        </div>

        {/* Countdown Timer */}
        {countdown !== null && countdown > 0 && (
          <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-destructive/90 rounded-full text-[10px] sm:text-xs font-bold text-destructive-foreground">
            <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span>{formatCountdown(countdown)}</span>
          </div>
        )}
      </div>
      
      <div className="p-3 sm:p-4 space-y-1.5 sm:space-y-2">
        <h3 className="font-semibold text-sm sm:text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {title}
        </h3>
        {description && (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}
        
        <div className="pt-1 sm:pt-2 flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-medium text-primary flex items-center gap-1">
            <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            Click to unlock
          </span>
          {requiredAds >= 3 && (
            <span className="flex items-center gap-1 text-[10px] sm:text-xs text-accent font-medium">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              Premium
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Lock, Sparkles, Download, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDisplayRating } from '@/hooks/useRatings';

interface ContentCardProps {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  requiredAds: number;
  views: number;
  unlocks: number;
  createdAt?: string;
  onClick: () => void;
  index?: number;
}

function getMetaLabel(requiredAds: number) {
  if (requiredAds >= 3) return 'PRO';
  if (requiredAds >= 2) return 'Premium';
  return 'MOD';
}

function formatDownloads(unlocks: number) {
  if (unlocks >= 1000000) return `${(unlocks / 1000000).toFixed(1)}M`;
  if (unlocks >= 1000) return `${(unlocks / 1000).toFixed(1)}K`;
  return unlocks.toString();
}

function isNew(createdAt?: string) {
  if (!createdAt) return false;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return new Date(createdAt) > sevenDaysAgo;
}

export function ContentCard({
  id,
  title,
  description,
  thumbnailUrl,
  requiredAds,
  views,
  unlocks,
  createdAt,
  onClick,
  index = 0
}: ContentCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const metaLabel = getMetaLabel(requiredAds);
  const { rating, hasUserRating } = getDisplayRating(id, views, unlocks);
  const downloads = formatDownloads(unlocks);
  const isNewApp = isNew(createdAt);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, [id]);

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

  const staggerDelay = Math.min(index, 12) * 0.03;

  return (
    <div 
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{ animationDelay: `${staggerDelay}s` }}
      className={cn(
        "app-card group",
        "opacity-0 animate-stagger-fade",
        isLoaded && "opacity-100"
      )}
    >
      {/* App Icon - Square with shimmer */}
      <div className="app-icon-wrapper">
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={title}
            loading="lazy"
            className="app-icon"
          />
        ) : (
          <div className="app-icon app-icon-placeholder">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        
        {/* Shimmer overlay on hover */}
        <div className="app-icon-shimmer" />
        
        {/* NEW Badge */}
        {isNewApp && (
          <div className="app-new-badge">
            <Zap className="w-2 h-2" />
            <span>NEW</span>
          </div>
        )}
        
        {/* PRO Badge Overlay */}
        {requiredAds >= 3 && (
          <div className="app-pro-badge">
            <Sparkles className="w-2.5 h-2.5" />
          </div>
        )}
      </div>
      
      {/* App Info */}
      <div className="app-info">
        <h3 className="app-title">{title}</h3>
        <p className="app-meta">{metaLabel}</p>
        
        {/* Rating & Downloads Row */}
        <div className="app-stats">
          <div className={cn("app-rating", hasUserRating && "text-yellow-400")}>
            <span className="app-rating-value">{rating}</span>
            <Star className={cn("w-3 h-3", hasUserRating ? "fill-yellow-400 text-yellow-400" : "fill-current")} />
          </div>
          <span className="app-stats-dot">•</span>
          <div className="app-downloads">
            <Download className="w-3 h-3" />
            <span>{downloads}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

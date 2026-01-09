import { useState, useEffect } from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContentCardProps {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  requiredAds: number;
  views: number;
  unlocks: number;
  onClick: () => void;
  index?: number;
}

function getMetaLabel(requiredAds: number, views: number, unlocks: number) {
  const labels: string[] = [];
  
  if (requiredAds >= 3) labels.push('PRO');
  else if (requiredAds >= 2) labels.push('Premium');
  else labels.push('MOD');
  
  if (views >= 100 || unlocks >= 50) labels.push('🔥 Hot');
  else if (views >= 50 || unlocks >= 20) labels.push('Trending');
  
  return labels.join(' • ');
}

export function ContentCard({
  id,
  title,
  description,
  thumbnailUrl,
  requiredAds,
  views,
  unlocks,
  onClick,
  index = 0
}: ContentCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const metaLabel = getMetaLabel(requiredAds, views, unlocks);

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
      {/* App Icon - Square */}
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
      </div>
    </div>
  );
}

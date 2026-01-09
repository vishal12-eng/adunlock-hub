import { useMemo } from 'react';
import { Lock, Sparkles, Star, Download, ChevronRight, Flame } from 'lucide-react';
import { Content } from '@/lib/api';
import { cn } from '@/lib/utils';

interface FeaturedAppsCarouselProps {
  contents: Content[];
  onContentClick: (content: Content) => void;
}

function getRating(views: number, unlocks: number) {
  const ratio = unlocks / Math.max(views, 1);
  const baseRating = 3.5 + (ratio * 1.5);
  return Math.min(5, Math.max(3.5, baseRating)).toFixed(1);
}

function formatDownloads(unlocks: number) {
  if (unlocks >= 1000) return `${(unlocks / 1000).toFixed(1)}K`;
  if (unlocks >= 100) return `${unlocks}+`;
  return `${Math.max(10, unlocks)}+`;
}

export function FeaturedAppsCarousel({ contents, onContentClick }: FeaturedAppsCarouselProps) {
  // Get top 10 trending apps based on views and unlocks
  const featuredApps = useMemo(() => {
    return [...contents]
      .sort((a, b) => (b.views + b.unlocks * 2) - (a.views + a.unlocks * 2))
      .slice(0, 10);
  }, [contents]);

  if (featuredApps.length === 0) return null;

  return (
    <section className="px-3 sm:px-4 pb-4 sm:pb-6">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-destructive" />
            <h2 className="text-base sm:text-lg font-bold text-foreground">Trending Now</h2>
          </div>
          <button className="flex items-center gap-1 text-xs sm:text-sm text-primary hover:text-primary/80 transition-colors">
            <span>See all</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Horizontal Scroll Container */}
        <div className="featured-carousel">
          <div className="featured-carousel-track">
            {featuredApps.map((content, index) => (
              <div
                key={content.id}
                onClick={() => onContentClick(content)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onContentClick(content);
                  }
                }}
                className={cn(
                  "featured-app-card group",
                  "opacity-0 animate-stagger-fade"
                )}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* App Icon */}
                <div className="featured-icon-wrapper">
                  {content.thumbnail_url ? (
                    <img 
                      src={content.thumbnail_url} 
                      alt={content.title}
                      loading="lazy"
                      className="featured-app-icon"
                    />
                  ) : (
                    <div className="featured-app-icon featured-icon-placeholder">
                      <Lock className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Shimmer overlay */}
                  <div className="featured-icon-shimmer" />
                  
                  {/* PRO Badge */}
                  {content.required_ads >= 3 && (
                    <div className="featured-pro-badge">
                      <Sparkles className="w-3 h-3" />
                    </div>
                  )}
                  
                  {/* Rank Badge */}
                  {index < 3 && (
                    <div className={cn(
                      "featured-rank-badge",
                      index === 0 && "bg-amber-500",
                      index === 1 && "bg-slate-400",
                      index === 2 && "bg-amber-700"
                    )}>
                      #{index + 1}
                    </div>
                  )}
                </div>

                {/* App Info */}
                <div className="featured-app-info">
                  <h3 className="featured-app-title">{content.title}</h3>
                  <p className="featured-app-meta">
                    {content.required_ads >= 3 ? 'PRO' : content.required_ads >= 2 ? 'Premium' : 'MOD'}
                  </p>
                  
                  {/* Stats Row */}
                  <div className="featured-app-stats">
                    <div className="flex items-center gap-0.5 text-amber-400">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{getRating(content.views, content.unlocks)}</span>
                    </div>
                    <span className="text-muted-foreground">•</span>
                    <div className="flex items-center gap-0.5">
                      <Download className="w-3 h-3" />
                      <span>{formatDownloads(content.unlocks)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

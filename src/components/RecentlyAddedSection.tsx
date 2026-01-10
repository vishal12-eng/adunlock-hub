import { useMemo } from 'react';
import { Content } from '@/lib/api';
import { Clock, Lock, Download, Star, Zap, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecentlyAddedSectionProps {
  contents: Content[];
  onContentClick: (content: Content) => void;
}

function formatDownloads(unlocks: number) {
  if (unlocks >= 1000) return `${(unlocks / 1000).toFixed(1)}K`;
  if (unlocks >= 100) return `${unlocks}+`;
  return `${Math.max(10, unlocks)}+`;
}

function getRating(views: number, unlocks: number) {
  const ratio = unlocks / Math.max(views, 1);
  const baseRating = 3.5 + (ratio * 1.5);
  return Math.min(5, Math.max(3.5, baseRating)).toFixed(1);
}

export function RecentlyAddedSection({ contents, onContentClick }: RecentlyAddedSectionProps) {
  // Get most recently added apps
  const recentApps = useMemo(() => {
    return [...contents]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8);
  }, [contents]);

  if (recentApps.length === 0) return null;

  return (
    <section className="px-3 sm:px-4 pb-4 sm:pb-6">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-base sm:text-lg font-bold text-foreground">Recently Added</h2>
          </div>
          <button className="flex items-center gap-1 text-xs sm:text-sm text-primary hover:text-primary/80 transition-colors">
            <span>See all</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Horizontal Scroll */}
        <div className="recently-added-carousel">
          <div className="recently-added-track">
            {recentApps.map((content, index) => (
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
                  "recently-added-card group",
                  "opacity-0 animate-stagger-fade"
                )}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* App Icon */}
                <div className="recently-added-icon-wrapper">
                  {content.thumbnail_url ? (
                    <img 
                      src={content.thumbnail_url} 
                      alt={content.title}
                      loading="lazy"
                      className="recently-added-icon"
                    />
                  ) : (
                    <div className="recently-added-icon recently-added-placeholder">
                      <Lock className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Shimmer overlay */}
                  <div className="recently-added-shimmer" />
                  
                  {/* NEW Badge */}
                  <div className="recently-new-badge">
                    <Zap className="w-2 h-2" />
                    <span>NEW</span>
                  </div>
                </div>

                {/* App Info */}
                <div className="recently-added-info">
                  <h3 className="recently-added-title">{content.title}</h3>
                  <p className="recently-added-meta">
                    {content.required_ads >= 3 ? 'PRO' : content.required_ads >= 2 ? 'Premium' : 'MOD'}
                  </p>
                  
                  {/* Stats Row */}
                  <div className="recently-added-stats">
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

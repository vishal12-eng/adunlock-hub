import { useMemo, useState } from 'react';
import { Lock, Sparkles, Star, Download, ChevronRight, Flame, Zap } from 'lucide-react';
import { Content } from '@/lib/api';
import { cn } from '@/lib/utils';
import { detectCategory, CATEGORIES } from '@/components/CategoryTags';

interface FeaturedAppsCarouselProps {
  contents: Content[];
  onContentClick: (content: Content) => void;
}

const QUICK_FILTERS = [
  { id: 'all', label: 'All', icon: Flame },
  { id: 'games', label: 'Games', icon: null },
  { id: 'apps', label: 'Apps', icon: null },
  { id: 'tools', label: 'Tools', icon: null },
  { id: 'media', label: 'Media', icon: null },
];

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

function isNew(createdAt: string) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return new Date(createdAt) > sevenDaysAgo;
}

export function FeaturedAppsCarousel({ contents, onContentClick }: FeaturedAppsCarouselProps) {
  const [activeFilter, setActiveFilter] = useState('all');

  // Get top trending apps filtered by category
  const featuredApps = useMemo(() => {
    let filtered = [...contents];
    
    if (activeFilter !== 'all') {
      filtered = filtered.filter(content => {
        const category = detectCategory(content.title, content.description);
        return category === activeFilter;
      });
    }
    
    return filtered
      .sort((a, b) => (b.views + b.unlocks * 2) - (a.views + a.unlocks * 2))
      .slice(0, 12);
  }, [contents, activeFilter]);

  if (contents.length === 0) return null;

  return (
    <section className="px-3 sm:px-4 pb-4 sm:pb-6">
      <div className="container mx-auto">
        {/* Section Header with Filter Chips */}
        <div className="flex flex-col gap-2 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-destructive" />
              <h2 className="text-base sm:text-lg font-bold text-foreground">Trending Now</h2>
            </div>
            <button className="flex items-center gap-1 text-xs sm:text-sm text-primary hover:text-primary/80 transition-colors">
              <span>See all</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          {/* Category Filter Chips */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
            {QUICK_FILTERS.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={cn(
                  "carousel-filter-chip",
                  activeFilter === filter.id && "carousel-filter-chip-active"
                )}
              >
                {filter.icon && <filter.icon className="w-3 h-3" />}
                <span>{filter.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Horizontal Scroll Container */}
        <div className="featured-carousel">
          <div className="featured-carousel-track">
            {featuredApps.map((content, index) => {
              const isNewApp = isNew(content.created_at);
              
              return (
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
                    
                    {/* NEW Badge */}
                    {isNewApp && (
                      <div className="featured-new-badge">
                        <Zap className="w-2 h-2" />
                        <span>NEW</span>
                      </div>
                    )}
                    
                    {/* PRO Badge */}
                    {content.required_ads >= 3 && (
                      <div className="featured-pro-badge">
                        <Sparkles className="w-3 h-3" />
                      </div>
                    )}
                    
                    {/* Rank Badge */}
                    {index < 3 && activeFilter === 'all' && (
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
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

import { Content } from '@/lib/api';
import { TrendingUp, Eye, Unlock, ArrowRight, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeaturedContentProps {
  contents: Content[];
  onContentClick: (content: Content) => void;
}

export function FeaturedContent({ contents, onContentClick }: FeaturedContentProps) {
  // Get top 3 most viewed contents
  const featured = [...contents]
    .sort((a, b) => b.views - a.views)
    .slice(0, 3);

  if (featured.length === 0) return null;

  return (
    <section className="px-3 sm:px-4 pb-8 sm:pb-12">
      <div className="container mx-auto">
        {/* Header with animation */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 opacity-0 animate-fade-in">
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-accent/20 rounded-full hover-glow transition-all duration-300">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
            <span className="text-xs sm:text-sm font-semibold text-accent">Trending Now</span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-accent/50 to-transparent" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {featured.map((content, index) => (
            <button
              key={content.id}
              onClick={() => onContentClick(content)}
              style={{ animationDelay: `${index * 0.1}s` }}
              className={cn(
                "relative overflow-hidden rounded-xl sm:rounded-2xl text-left transition-all duration-500 group touch-active hover-lift",
                "opacity-0 animate-stagger-fade",
                index === 0 && 'md:col-span-2 md:row-span-2'
              )}
            >
              {/* Background image */}
              <div className={cn(
                "relative",
                index === 0 ? 'aspect-video md:aspect-[16/10]' : 'aspect-video'
              )}>
                {content.thumbnail_url ? (
                  <img
                    src={content.thumbnail_url}
                    alt={content.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-accent/30 to-primary/30 flex items-center justify-center">
                    <Lock className="w-10 h-10 sm:w-16 sm:h-16 text-muted-foreground transition-transform duration-300 group-hover:scale-110" />
                  </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

                {/* Rank badge with bounce animation */}
                <div className="absolute top-2 sm:top-4 left-2 sm:left-4 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 glass rounded-full animate-bounce-in">
                  <span className="text-sm sm:text-lg font-bold text-primary">#{index + 1}</span>
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                </div>

                {/* Content info */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6">
                  <h3 className={cn(
                    "font-bold text-foreground mb-1 sm:mb-2 group-hover:text-primary transition-colors duration-300 line-clamp-2",
                    index === 0 ? 'text-base sm:text-2xl md:text-3xl' : 'text-sm sm:text-lg'
                  )}>
                    {content.title}
                  </h3>

                  {content.description && index === 0 && (
                    <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2 mb-2 sm:mb-4 hidden sm:block">
                      {content.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                    <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground">
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-[10px] sm:text-sm">{content.views.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground">
                      <Unlock className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-[10px] sm:text-sm">{content.unlocks.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-1.5 text-primary ml-auto">
                      <span className="text-[10px] sm:text-sm font-medium">{content.required_ads} ads</span>
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Hover border effect with glow */}
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/50 rounded-xl sm:rounded-2xl transition-all duration-300 group-hover:shadow-neon" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

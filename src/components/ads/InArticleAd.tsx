import { useEffect, useRef, useState, memo } from 'react';
import { useAdsConfig } from '@/hooks/useAdsConfig';
import { getNextNativeAd } from '@/lib/ads/config';
import { cn } from '@/lib/utils';
import { Sparkles, TrendingUp, Gift, Star, ExternalLink } from 'lucide-react';

type AdStyle = 'card' | 'banner' | 'minimal' | 'featured' | 'recommendation';

interface InArticleAdProps {
  className?: string;
  style?: AdStyle;
  showIcon?: boolean;
}

// Fake "recommended" content that looks native
const PROMOTED_CONTENT = [
  {
    title: "Boost Your Experience",
    description: "Unlock premium features with special offers",
    icon: Sparkles,
    gradient: "from-purple-500/20 to-pink-500/20",
    borderGlow: "group-hover:shadow-purple-500/20"
  },
  {
    title: "Trending Now",
    description: "Discover what others are unlocking",
    icon: TrendingUp,
    gradient: "from-cyan-500/20 to-blue-500/20",
    borderGlow: "group-hover:shadow-cyan-500/20"
  },
  {
    title: "Exclusive Rewards",
    description: "Limited time offers available",
    icon: Gift,
    gradient: "from-amber-500/20 to-orange-500/20",
    borderGlow: "group-hover:shadow-amber-500/20"
  },
  {
    title: "Top Rated Content",
    description: "Most popular downloads this week",
    icon: Star,
    gradient: "from-emerald-500/20 to-teal-500/20",
    borderGlow: "group-hover:shadow-emerald-500/20"
  }
];

export const InArticleAd = memo(function InArticleAd({ 
  className = '', 
  style = 'card',
  showIcon = true 
}: InArticleAdProps) {
  const { nativeAds, loading } = useAdsConfig();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);
  const [promoted] = useState(() => PROMOTED_CONTENT[Math.floor(Math.random() * PROMOTED_CONTENT.length)]);
  const ad = !loading && nativeAds.enabled ? getNextNativeAd(nativeAds) : null;

  useEffect(() => {
    if (ad && containerRef.current) {
      try {
        containerRef.current.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.innerHTML = ad.code;
        
        const scripts = wrapper.querySelectorAll('script');
        scripts.forEach(script => {
          const newScript = document.createElement('script');
          Array.from(script.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
          });
          newScript.textContent = script.textContent;
          script.parentNode?.replaceChild(newScript, script);
        });
        
        containerRef.current.appendChild(wrapper);
      } catch (error) {
        console.error('Failed to render in-article ad:', error);
        setHasError(true);
      }
    }
  }, [ad]);

  if (loading || hasError) return null;

  // If no native ads configured, show promotional placeholder
  if (!nativeAds.enabled || !ad) {
    return (
      <div 
        className={cn(
          "group cursor-pointer transition-all duration-300",
          style === 'card' && "glass rounded-xl p-4 hover-lift",
          style === 'banner' && "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg p-3 border border-primary/20",
          style === 'minimal' && "border-l-2 border-primary/50 pl-4 py-2",
          style === 'featured' && `glass rounded-2xl p-5 bg-gradient-to-br ${promoted.gradient} hover-glow`,
          style === 'recommendation' && "flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50",
          className
        )}
      >
        <div className="text-[9px] text-muted-foreground/50 mb-2">Sponsored</div>
        
        {style === 'featured' ? (
          <div className="flex items-start gap-4">
            {showIcon && (
              <div className="p-3 rounded-xl bg-primary/20 text-primary">
                <promoted.icon className="w-6 h-6" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground text-sm sm:text-base mb-1">
                {promoted.title}
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                {promoted.description}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-primary text-xs font-medium">
                <span>Learn More</span>
                <ExternalLink className="w-3 h-3" />
              </div>
            </div>
          </div>
        ) : style === 'recommendation' ? (
          <>
            {showIcon && (
              <div className="p-2 rounded-lg bg-primary/15 text-primary flex-shrink-0">
                <promoted.icon className="w-4 h-4" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-foreground text-sm truncate">{promoted.title}</h4>
              <p className="text-xs text-muted-foreground truncate">{promoted.description}</p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </>
        ) : (
          <div className="flex items-center gap-3">
            {showIcon && (
              <div className="p-2 rounded-lg bg-primary/15 text-primary flex-shrink-0">
                <promoted.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-foreground text-sm">{promoted.title}</h4>
              <p className="text-xs text-muted-foreground">{promoted.description}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render actual native ad
  return (
    <div 
      className={cn(
        "in-article-ad transition-all duration-300",
        style === 'card' && "glass rounded-xl overflow-hidden",
        style === 'banner' && "bg-muted/30 rounded-lg overflow-hidden",
        style === 'minimal' && "border-l-2 border-primary/30",
        style === 'featured' && "glass rounded-2xl overflow-hidden bg-gradient-to-br from-primary/5 to-transparent",
        style === 'recommendation' && "rounded-xl bg-muted/20 overflow-hidden",
        className
      )}
      data-ad-type="in-article"
    >
      <div className="text-[9px] text-muted-foreground/50 px-3 py-1">
        Sponsored
      </div>
      <div 
        ref={containerRef} 
        className="ad-content px-3 pb-3"
      />
    </div>
  );
});

// Full-width promotional banner
export function PromoStrip({ className = '' }: { className?: string }) {
  const [promoted] = useState(() => PROMOTED_CONTENT[Math.floor(Math.random() * PROMOTED_CONTENT.length)]);
  
  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-xl sm:rounded-2xl",
        "bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20",
        "border border-primary/20",
        "p-4 sm:p-6",
        "cursor-pointer group",
        "hover:border-primary/40 transition-all duration-300",
        className
      )}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        <div className="p-3 sm:p-4 rounded-xl bg-primary/20 text-primary group-hover:scale-110 transition-transform duration-300">
          <promoted.icon className="w-6 h-6 sm:w-8 sm:h-8" />
        </div>
        
        <div className="flex-1 text-center sm:text-left">
          <div className="text-[10px] text-muted-foreground/60 mb-1">Promoted</div>
          <h3 className="text-base sm:text-lg font-bold text-foreground mb-1">
            {promoted.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {promoted.description}
          </p>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium group-hover:bg-primary/90 transition-colors">
          <span>Explore</span>
          <ExternalLink className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

// Compact sidebar ad
export function SidebarAd({ className = '' }: { className?: string }) {
  const [promoted] = useState(() => PROMOTED_CONTENT[Math.floor(Math.random() * PROMOTED_CONTENT.length)]);
  
  return (
    <div 
      className={cn(
        "glass rounded-xl p-4 space-y-3 cursor-pointer group hover-lift",
        className
      )}
    >
      <div className="text-[9px] text-muted-foreground/50">Sponsored</div>
      
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2.5 rounded-xl bg-gradient-to-br text-white",
          promoted.gradient.replace('/20', '')
        )}>
          <promoted.icon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-semibold text-foreground text-sm">{promoted.title}</h4>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground leading-relaxed">
        {promoted.description}
      </p>
      
      <div className="flex items-center gap-1.5 text-primary text-xs font-medium group-hover:gap-2 transition-all">
        <span>Learn more</span>
        <ExternalLink className="w-3 h-3" />
      </div>
    </div>
  );
}

// Text link ad that blends with content
export function TextLinkAd({ className = '' }: { className?: string }) {
  const [promoted] = useState(() => PROMOTED_CONTENT[Math.floor(Math.random() * PROMOTED_CONTENT.length)]);
  
  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="text-[9px] text-muted-foreground/40">Ad</span>
      <a 
        href="#" 
        className="text-primary hover:text-primary/80 text-sm underline-offset-2 hover:underline transition-colors"
        onClick={(e) => e.preventDefault()}
      >
        {promoted.title} →
      </a>
    </div>
  );
}

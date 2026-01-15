import { useEffect, useRef, useState, memo } from 'react';
import { useAdsConfig } from '@/hooks/useAdsConfig';
import { getNextNativeAd } from '@/lib/ads/config';
import { cn } from '@/lib/utils';
import { Zap, ArrowRight } from 'lucide-react';

interface ContentDividerAdProps {
  className?: string;
  variant?: 'simple' | 'decorated' | 'gradient';
}

export const ContentDividerAd = memo(function ContentDividerAd({ 
  className = '',
  variant = 'decorated'
}: ContentDividerAdProps) {
  const { nativeAds, loading } = useAdsConfig();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);
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
        console.error('Failed to render divider ad:', error);
        setHasError(true);
      }
    }
  }, [ad]);

  if (loading || hasError) return null;

  // Promotional fallback when no ads configured
  if (!nativeAds.enabled || !ad) {
    return (
      <div className={cn("relative py-6 sm:py-8", className)}>
        {/* Decorative lines */}
        {variant === 'decorated' && (
          <>
            <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-4 bg-background">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 text-primary text-sm">
                <Zap className="w-4 h-4" />
                <span className="font-medium">Special Offers</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </>
        )}
        
        {variant === 'gradient' && (
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 p-4 sm:p-6">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
            <div className="relative flex items-center justify-center gap-3 text-center">
              <Zap className="w-5 h-5 text-primary" />
              <div>
                <div className="text-[9px] text-muted-foreground/60 mb-0.5">Promoted</div>
                <p className="text-sm font-medium text-foreground">Discover exclusive rewards and offers</p>
              </div>
              <ArrowRight className="w-5 h-5 text-primary" />
            </div>
          </div>
        )}
        
        {variant === 'simple' && (
          <div className="flex items-center justify-center gap-3 py-2">
            <div className="h-px flex-1 bg-border/50" />
            <div className="text-[10px] text-muted-foreground/50 flex items-center gap-1.5">
              <span>Ad</span>
              <span>•</span>
              <span className="text-primary">Special Offer Available</span>
            </div>
            <div className="h-px flex-1 bg-border/50" />
          </div>
        )}
      </div>
    );
  }

  // Render actual ad
  return (
    <div 
      className={cn("relative py-4 sm:py-6", className)}
      data-ad-type="content-divider"
    >
      <div className="text-[9px] text-center text-muted-foreground/50 mb-2">Sponsored</div>
      <div 
        ref={containerRef} 
        className="flex items-center justify-center"
      />
    </div>
  );
});

// Inline ad that sits between paragraphs
export function InlineTextAd({ className = '' }: { className?: string }) {
  return (
    <div className={cn(
      "my-4 sm:my-6 p-4 rounded-xl bg-muted/30 border border-border/50",
      "flex items-center gap-4",
      "cursor-pointer group hover:bg-muted/50 transition-colors",
      className
    )}>
      <div className="p-2.5 rounded-xl bg-primary/15 text-primary group-hover:scale-105 transition-transform">
        <Zap className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[9px] text-muted-foreground/50 mb-0.5">Sponsored</div>
        <p className="text-sm font-medium text-foreground">Unlock more premium content with special offers</p>
      </div>
      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
    </div>
  );
}

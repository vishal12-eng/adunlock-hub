import { useState, useEffect, useRef, memo } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MinimizableNativeAdProps {
  className?: string;
  position?: 'top' | 'inline';
}

export const MinimizableNativeAd = memo(function MinimizableNativeAd({
  className = '',
  position = 'top'
}: MinimizableNativeAdProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!containerRef.current || isDismissed) return;

    const adContainer = containerRef.current.querySelector('#container-a5954d218ec9be7d568786692d7c299f');
    if (!adContainer) return;

    // Check if script already exists
    if (document.querySelector('script[src*="a5954d218ec9be7d568786692d7c299f"]')) {
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = 'https://passivealexis.com/a5954d218ec9be7d568786692d7c299f/invoke.js';
    
    adContainer.parentNode?.insertBefore(script, adContainer);

    return () => {
      script.remove();
    };
  }, [isDismissed]);

  if (isDismissed) return null;

  return (
    <div 
      className={`relative transition-all duration-300 ease-in-out ${className} ${
        position === 'top' ? 'w-full' : ''
      }`}
    >
      {/* Control buttons */}
      <div className={`absolute ${isMobile ? 'top-1 right-1' : 'top-2 right-2'} z-10 flex items-center gap-1`}>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className={`${isMobile ? 'p-1' : 'p-1.5'} rounded-full bg-black/60 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/80 transition-all`}
          aria-label={isMinimized ? 'Expand ad' : 'Minimize ad'}
        >
          {isMinimized ? (
            <ChevronDown className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
          ) : (
            <ChevronUp className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
          )}
        </button>
        <button
          onClick={() => setIsDismissed(true)}
          className={`${isMobile ? 'p-1' : 'p-1.5'} rounded-full bg-black/60 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/80 transition-all`}
          aria-label="Close ad"
        >
          <X className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
        </button>
      </div>

      {/* Ad container */}
      <div
        ref={containerRef}
        className={`overflow-hidden transition-all duration-300 ease-in-out rounded-lg ${
          isMinimized 
            ? isMobile ? 'max-h-8' : 'max-h-10'
            : isMobile ? 'max-h-[120px]' : 'max-h-[150px]'
        }`}
        style={{
          opacity: isMinimized ? 0.7 : 1,
        }}
      >
        {/* Minimized label */}
        {isMinimized && (
          <div className={`flex items-center justify-center ${isMobile ? 'h-8 text-[10px]' : 'h-10 text-xs'} bg-muted/50 text-muted-foreground`}>
            <span>Ad minimized • Click to expand</span>
          </div>
        )}
        
        {/* Native ad content */}
        <div className={isMinimized ? 'hidden' : 'block'}>
          <div id="container-a5954d218ec9be7d568786692d7c299f" />
        </div>
      </div>
    </div>
  );
});

export default MinimizableNativeAd;

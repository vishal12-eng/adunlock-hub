import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StickyBottomAdProps {
  className?: string;
  showCloseButton?: boolean;
  autoHideAfter?: number; // seconds
}

export function StickyBottomAd({ 
  className = '', 
  showCloseButton = true,
  autoHideAfter 
}: StickyBottomAdProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    // Check if already dismissed this session
    const dismissed = sessionStorage.getItem('sticky_ad_dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Show after a short delay for better UX
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (autoHideAfter && isVisible) {
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, autoHideAfter * 1000);

      return () => clearTimeout(hideTimer);
    }
  }, [autoHideAfter, isVisible]);

  useEffect(() => {
    if (containerRef.current && !isLoaded.current && isVisible) {
      isLoaded.current = true;

      // Create the atOptions script for Adsterra
      const optionsScript = document.createElement('script');
      optionsScript.textContent = `
        atOptions = {
          'key' : '930770bbbbdf63e751b7e613e1c40d1e',
          'format' : 'iframe',
          'height' : 60,
          'width' : 468,
          'params' : {}
        };
      `;
      containerRef.current.appendChild(optionsScript);

      // Load the banner ad script
      const script = document.createElement('script');
      script.src = 'https://passivealexis.com/930770bbbbdf63e751b7e613e1c40d1e/invoke.js';
      containerRef.current.appendChild(script);
    }
  }, [isVisible]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem('sticky_ad_dismissed', 'true');
  };

  if (isDismissed || !isVisible) return null;

  return (
    <div 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 safe-area-inset-bottom",
        "bg-background/95 backdrop-blur-md border-t border-border/50",
        "animate-slide-up",
        className
      )}
    >
      <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-2">
        <div className="text-[10px] text-muted-foreground/60 absolute left-3 top-1">
          Ad
        </div>
        
        <div 
          ref={containerRef} 
          className="flex items-center justify-center min-h-[60px]"
        />
        
        {showCloseButton && (
          <button
            onClick={handleDismiss}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close ad"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

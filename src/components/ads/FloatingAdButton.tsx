import { useState, useEffect, useCallback } from 'react';
import { Gift, X, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface FloatingAdButtonProps {
  className?: string;
  showAfterScroll?: number; // pixels
  position?: 'left' | 'right';
}

export function FloatingAdButton({ 
  className = '',
  showAfterScroll = 300,
  position = 'right'
}: FloatingAdButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [smartlinkUrl, setSmartlinkUrl] = useState<string | null>(null);

  const fetchSmartlink = useCallback(async () => {
    try {
      const response = await api.getSmartlink();
      setSmartlinkUrl(response.url);
    } catch (error) {
      console.error('Failed to fetch smartlink:', error);
    }
  }, []);

  useEffect(() => {
    // Check if already dismissed this session
    const dismissed = sessionStorage.getItem('floating_ad_dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    fetchSmartlink();

    const handleScroll = () => {
      if (window.scrollY > showAfterScroll) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
        setIsExpanded(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAfterScroll, fetchSmartlink]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    sessionStorage.setItem('floating_ad_dismissed', 'true');
  };

  const handleClick = () => {
    if (isExpanded && smartlinkUrl) {
      window.open(smartlinkUrl, '_blank', 'noopener,noreferrer');
    } else {
      setIsExpanded(true);
    }
  };

  if (isDismissed || !isVisible) return null;

  return (
    <div
      className={cn(
        "fixed z-40 transition-all duration-300",
        position === 'right' ? 'right-4' : 'left-4',
        "bottom-20 sm:bottom-24",
        isExpanded ? "scale-100" : "scale-95 hover:scale-100",
        className
      )}
    >
      <div
        onClick={handleClick}
        className={cn(
          "relative cursor-pointer group",
          "bg-gradient-to-br from-primary via-primary to-primary/80",
          "rounded-2xl shadow-lg shadow-primary/25",
          "transition-all duration-300 transform",
          isExpanded ? "p-4 min-w-[200px]" : "p-3"
        )}
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className={cn(
            "absolute -top-2 -right-2 w-6 h-6 rounded-full",
            "bg-background border border-border",
            "flex items-center justify-center",
            "text-muted-foreground hover:text-foreground",
            "transition-opacity duration-200",
            isExpanded ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          <X className="w-3 h-3" />
        </button>

        {isExpanded ? (
          <div className="text-primary-foreground space-y-2">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 animate-bounce" />
              <span className="font-bold text-sm">Special Offer!</span>
            </div>
            <p className="text-xs opacity-90">
              Click to claim your exclusive reward
            </p>
            <div className="flex items-center gap-1 text-xs font-medium">
              <ExternalLink className="w-3 h-3" />
              <span>View Offer</span>
            </div>
          </div>
        ) : (
          <div className="relative">
            <Gift className="w-6 h-6 text-primary-foreground animate-pulse" />
            {/* Notification dot */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-ping" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { X, Gift, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';

export function ExitIntentPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);
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
    // Check if already shown in this session
    const shown = sessionStorage.getItem('exitIntentShown');
    if (shown) {
      setHasShown(true);
      return;
    }

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger when mouse leaves from the top
      if (e.clientY <= 0 && !hasShown) {
        setIsVisible(true);
        setHasShown(true);
        sessionStorage.setItem('exitIntentShown', 'true');
        fetchSmartlink();
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hasShown, fetchSmartlink]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleAdClick = () => {
    if (smartlinkUrl) {
      window.open(smartlinkUrl, '_blank', 'noopener,noreferrer');
    }
    handleClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-md mx-4 glass-intense neon-border p-8 rounded-2xl text-center space-y-6">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Gift icon */}
        <div className="w-20 h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center animate-pulse-neon">
          <Gift className="w-10 h-10 text-primary" />
        </div>

        <div>
          <h3 className="text-2xl font-bold text-foreground mb-2">
            Wait! Don't Leave Yet!
          </h3>
          <p className="text-muted-foreground">
            Check out this exclusive offer before you go. You might find something amazing!
          </p>
        </div>

        <button
          onClick={handleAdClick}
          className="w-full btn-neon flex items-center justify-center gap-2 py-4"
        >
          <ExternalLink className="w-5 h-5" />
          View Special Offer
        </button>

        <button
          onClick={handleClose}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          No thanks, I'll continue browsing
        </button>
      </div>
    </div>
  );
}

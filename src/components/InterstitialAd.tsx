import { useState, useEffect, useCallback } from 'react';
import { X, Clock, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';

interface InterstitialAdProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function InterstitialAd({ isOpen, onClose, onComplete }: InterstitialAdProps) {
  const [countdown, setCountdown] = useState(5);
  const [canClose, setCanClose] = useState(false);
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
    if (isOpen) {
      setCountdown(5);
      setCanClose(false);
      fetchSmartlink();

      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanClose(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen, fetchSmartlink]);

  const handleAdClick = () => {
    if (smartlinkUrl) {
      window.open(smartlinkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleClose = () => {
    if (canClose) {
      onComplete?.();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-lg mx-4">
        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={!canClose}
          className={`absolute -top-12 right-0 flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
            canClose
              ? 'bg-primary text-primary-foreground hover:scale-105'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          {canClose ? (
            <>
              <X className="w-4 h-4" />
              Close
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 animate-pulse" />
              Wait {countdown}s
            </>
          )}
        </button>

        {/* Ad content */}
        <div className="glass-intense neon-border p-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
            <span className="text-xs font-medium text-primary uppercase tracking-wider">Sponsored</span>
          </div>

          <h3 className="text-2xl font-bold text-foreground">
            Discover Premium Content
          </h3>

          <p className="text-muted-foreground">
            Click below to explore exclusive offers and unlock more rewards!
          </p>

          <button
            onClick={handleAdClick}
            className="w-full btn-neon flex items-center justify-center gap-2 py-4"
          >
            <ExternalLink className="w-5 h-5" />
            View Special Offer
          </button>

          <p className="text-xs text-muted-foreground">
            {canClose ? 'You can now close this ad' : `Ad closes in ${countdown} seconds`}
          </p>
        </div>
      </div>
    </div>
  );
}

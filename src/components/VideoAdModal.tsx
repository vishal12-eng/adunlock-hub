import { useState, useEffect, useCallback } from 'react';
import { X, Play, Volume2, VolumeX } from 'lucide-react';
import { api } from '@/lib/api';

interface VideoAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function VideoAdModal({ isOpen, onClose, onComplete }: VideoAdModalProps) {
  const [countdown, setCountdown] = useState(5);
  const [canSkip, setCanSkip] = useState(false);
  const [smartlinkUrl, setSmartlinkUrl] = useState('');
  const [isMuted, setIsMuted] = useState(true);

  const fetchSmartlink = useCallback(async () => {
    try {
      const { value } = await api.getSetting('adsterra_smartlink');
      if (value) {
        setSmartlinkUrl(value);
      }
    } catch {
      // Fallback handled
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchSmartlink();
      setCountdown(5);
      setCanSkip(false);
    }
  }, [isOpen, fetchSmartlink]);

  useEffect(() => {
    if (!isOpen || canSkip) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setCanSkip(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, canSkip]);

  function handleAdClick() {
    if (smartlinkUrl) {
      window.open(smartlinkUrl, '_blank');
    }
  }

  function handleSkip() {
    onComplete?.();
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/95 backdrop-blur-xl" />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 glass-intense rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="text-sm text-muted-foreground">Sponsored Content</span>
          {canSkip ? (
            <button
              onClick={handleSkip}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <X className="w-4 h-4" />
              Skip Ad
            </button>
          ) : (
            <span className="px-3 py-1.5 bg-muted rounded-lg text-sm font-medium text-muted-foreground">
              Skip in {countdown}s
            </span>
          )}
        </div>

        {/* Video Placeholder */}
        <div 
          onClick={handleAdClick}
          className="relative aspect-video bg-gradient-to-br from-secondary to-muted cursor-pointer group"
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Play className="w-10 h-10 text-primary" />
            </div>
            <p className="text-lg font-semibold text-foreground">Watch This Ad</p>
            <p className="text-sm text-muted-foreground">Click to view sponsored content</p>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="px-2 py-1 bg-destructive text-destructive-foreground rounded text-xs font-bold animate-pulse">
              AD
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMuted(!isMuted);
            }}
            className="absolute bottom-4 right-4 p-2 glass rounded-lg hover:bg-muted/80 transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Volume2 className="w-5 h-5 text-primary" />
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Ads help keep this service free
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-muted-foreground">Live</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

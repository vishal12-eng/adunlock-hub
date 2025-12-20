import { useState, useEffect } from 'react';
import { Clock, Zap, X } from 'lucide-react';

export function TimedOfferBanner() {
  const [timeLeft, setTimeLeft] = useState(getInitialTime());
  const [dismissed, setDismissed] = useState(false);

  function getInitialTime() {
    // Check session storage for existing timer
    const stored = sessionStorage.getItem('offer_timer_end');
    if (stored) {
      const remaining = Math.max(0, Math.floor((parseInt(stored) - Date.now()) / 1000));
      return remaining;
    }
    // Set random time between 15-45 minutes
    const randomMinutes = Math.floor(Math.random() * 30) + 15;
    const endTime = Date.now() + randomMinutes * 60 * 1000;
    sessionStorage.setItem('offer_timer_end', endTime.toString());
    return randomMinutes * 60;
  }

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  if (dismissed || timeLeft <= 0) return null;

  return (
    <div className="relative overflow-hidden glass-intense border-primary/30 rounded-xl p-4 animate-pulse-neon">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center justify-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary animate-pulse" />
          <span className="text-sm font-bold text-foreground">HAPPY HOUR!</span>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Faster unlocks available for limited time
        </p>
        
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 rounded-lg">
          <Clock className="w-4 h-4 text-primary" />
          <span className="font-mono font-bold text-primary">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Animated background */}
      <div className="absolute inset-0 -z-10 opacity-20">
        <div className="absolute inset-0 animate-shimmer" />
      </div>
    </div>
  );
}

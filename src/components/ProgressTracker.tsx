import { useState, useEffect } from 'react';
import { Trophy, Zap, Star, Target } from 'lucide-react';

const milestones = [
  { count: 1, label: 'First Unlock!', icon: Zap },
  { count: 3, label: 'Getting Started', icon: Star },
  { count: 5, label: 'Power User', icon: Trophy },
  { count: 10, label: 'Super Fan', icon: Target },
];

export function ProgressTracker() {
  const [unlockCount, setUnlockCount] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastMilestone, setLastMilestone] = useState<string | null>(null);

  useEffect(() => {
    // Get session unlock count
    const count = parseInt(sessionStorage.getItem('session_unlocks') || '0');
    setUnlockCount(count);

    // Listen for unlock events
    const handleUnlock = () => {
      const newCount = parseInt(sessionStorage.getItem('session_unlocks') || '0') + 1;
      sessionStorage.setItem('session_unlocks', newCount.toString());
      setUnlockCount(newCount);

      // Check for milestone
      const milestone = milestones.find(m => m.count === newCount);
      if (milestone) {
        setLastMilestone(milestone.label);
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }
    };

    window.addEventListener('content-unlocked', handleUnlock);
    return () => window.removeEventListener('content-unlocked', handleUnlock);
  }, []);

  if (unlockCount === 0) return null;

  const nextMilestone = milestones.find(m => m.count > unlockCount) || milestones[milestones.length - 1];
  const progress = Math.min((unlockCount / nextMilestone.count) * 100, 100);

  return (
    <div className="relative">
      <div className="glass rounded-xl p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <span className="text-xs sm:text-sm font-semibold text-foreground">Session Progress</span>
          </div>
          <span className="text-[10px] sm:text-xs text-muted-foreground">
            {unlockCount} unlocked
          </span>
        </div>

        <div className="progress-bar mb-2">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-[10px] sm:text-xs text-muted-foreground">
          {unlockCount >= nextMilestone.count 
            ? '🎉 All milestones achieved!' 
            : `${nextMilestone.count - unlockCount} more to reach "${nextMilestone.label}"`
          }
        </p>
      </div>

      {/* Celebration popup */}
      {showCelebration && lastMilestone && (
        <div className="absolute -top-10 sm:-top-12 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary text-primary-foreground rounded-full text-xs sm:text-sm font-bold animate-bounce whitespace-nowrap">
          🎉 {lastMilestone}!
        </div>
      )}
    </div>
  );
}

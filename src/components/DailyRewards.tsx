import { useState, useEffect, useCallback } from 'react';
import { Calendar, Gift, Flame, Star, Trophy, Check, Coins, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useShop } from '@/hooks/useShop';
import { cn } from '@/lib/utils';

// Legacy storage key for migration
const LEGACY_STORAGE_KEY = 'adnexus_daily_rewards';

interface DailyRewardsWidgetProps {
  variant?: 'compact' | 'full';
}

// Format time remaining
function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Ready!';
  
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function DailyRewardsWidget({ variant = 'compact' }: DailyRewardsWidgetProps) {
  const { dailyRewardsStatus, claimDailyReward, dailyRewardConfig } = useShop();
  const [timeDisplay, setTimeDisplay] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  
  // Update countdown every second
  useEffect(() => {
    const updateTime = () => {
      setTimeDisplay(formatTimeRemaining(dailyRewardsStatus.timeUntilNext));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [dailyRewardsStatus.timeUntilNext]);
  
  const handleClaim = useCallback(() => {
    if (isClaiming) return;
    setIsClaiming(true);
    
    const result = claimDailyReward();
    
    // Reset claiming state after a short delay
    setTimeout(() => setIsClaiming(false), 500);
  }, [claimDailyReward, isClaiming]);
  
  // Check if daily rewards are enabled
  if (!dailyRewardConfig.enabled) {
    return null;
  }
  
  if (variant === 'compact') {
    return (
      <div className="glass rounded-xl p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className={cn(
              "w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0",
              dailyRewardsStatus.canClaim 
                ? "bg-primary/20 animate-pulse" 
                : "bg-green-500/20"
            )}>
              {dailyRewardsStatus.canClaim ? (
                <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              ) : (
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                {dailyRewardsStatus.canClaim ? 'Daily Reward' : 'Claimed!'}
              </p>
              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
                <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-orange-400" />
                {dailyRewardsStatus.streak} day streak
              </div>
            </div>
          </div>
          
          {dailyRewardsStatus.canClaim ? (
            <Button 
              size="sm" 
              onClick={handleClaim} 
              disabled={isClaiming}
              className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 h-7 sm:h-8 flex-shrink-0"
            >
              <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Claim</span>
            </Button>
          ) : (
            <div className="text-[10px] sm:text-xs text-muted-foreground text-right flex-shrink-0">
              <div>Tomorrow:</div>
              <div className="flex items-center gap-1">
                {dailyRewardsStatus.nextReward.coins > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Coins className="w-3 h-3 text-yellow-400" />
                    {dailyRewardsStatus.nextReward.coins}
                  </span>
                )}
                {dailyRewardsStatus.nextReward.unlockCards > 0 && (
                  <span className="flex items-center gap-0.5">
                    <CreditCard className="w-3 h-3 text-green-400" />
                    {dailyRewardsStatus.nextReward.unlockCards}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        
        {dailyRewardsStatus.streak > 0 && (
          <div className="mt-2 sm:mt-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs sm:text-sm text-primary">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
              {dailyRewardsStatus.totalClaims} total claims
            </p>
          </div>
        )}
      </div>
    );
  }
  
  // Full variant
  return (
    <Card className="glass-intense border-border/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Daily Rewards
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
          <div className="flex items-center gap-3">
            <Flame className="w-8 h-8 text-orange-400" />
            <div>
              <p className="text-2xl font-bold text-foreground">{dailyRewardsStatus.streak}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-primary">{dailyRewardsStatus.totalClaims}</p>
            <p className="text-xs text-muted-foreground">Total Claims</p>
          </div>
        </div>
        
        {/* 7-Day Calendar */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }, (_, i) => {
            const day = i + 1;
            const isCompleted = dailyRewardsStatus.streak >= day;
            const isNext = dailyRewardsStatus.streak === i && dailyRewardsStatus.canClaim;
            
            return (
              <div
                key={day}
                className={cn(
                  "aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all",
                  isCompleted
                    ? "bg-green-500/20 border border-green-500/30"
                    : isNext
                    ? "bg-primary/20 border border-primary/50 animate-pulse"
                    : "bg-secondary/30 border border-border/30"
                )}
              >
                <span className={cn(
                  "font-bold",
                  isCompleted ? "text-green-400" : isNext ? "text-primary" : "text-muted-foreground"
                )}>
                  {day}
                </span>
                {isCompleted ? (
                  <Check className="w-3 h-3 text-green-400" />
                ) : (
                  <Gift className={cn("w-3 h-3", isNext ? "text-primary" : "text-muted-foreground")} />
                )}
              </div>
            );
          })}
        </div>
        
        {/* Reward Preview */}
        <div className="flex items-center justify-center gap-4 p-3 rounded-lg bg-secondary/20">
          {dailyRewardsStatus.nextReward.coins > 0 && (
            <div className="flex items-center gap-1.5 text-sm">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="font-medium">+{dailyRewardsStatus.nextReward.coins}</span>
            </div>
          )}
          {dailyRewardsStatus.nextReward.unlockCards > 0 && (
            <div className="flex items-center gap-1.5 text-sm">
              <CreditCard className="w-4 h-4 text-green-400" />
              <span className="font-medium">+{dailyRewardsStatus.nextReward.unlockCards}</span>
            </div>
          )}
        </div>
        
        {dailyRewardsStatus.canClaim ? (
          <Button onClick={handleClaim} disabled={isClaiming} className="w-full gap-2">
            <Gift className="w-4 h-4" />
            Claim Day {dailyRewardsStatus.streak + 1} Reward
          </Button>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            Next reward in {timeDisplay}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Export legacy hook for compatibility (redirects to new system)
export function useDailyRewards() {
  const { dailyRewardsStatus, claimDailyReward, dailyRewardConfig } = useShop();
  
  return {
    currentStreak: dailyRewardsStatus.streak,
    todayClaimed: !dailyRewardsStatus.canClaim,
    bonusUnlocks: dailyRewardsStatus.nextReward.unlockCards,
    claimReward: () => {
      const result = claimDailyReward();
      return result.success ? dailyRewardsStatus.nextReward.unlockCards : 0;
    },
    useBonusUnlock: () => false, // Deprecated - use useShop instead
    currentDayReward: { day: dailyRewardsStatus.streak % 7, reward: dailyRewardsStatus.nextReward.unlockCards, label: `${dailyRewardsStatus.nextReward.unlockCards} Unlock` },
    nextDayReward: { day: (dailyRewardsStatus.streak + 1) % 7, reward: dailyRewardsStatus.nextReward.unlockCards, label: `${dailyRewardsStatus.nextReward.unlockCards} Unlock` },
  };
}

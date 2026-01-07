import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Gift, 
  Flame, 
  Star, 
  Clock, 
  Coins, 
  CreditCard,
  Check,
  Sparkles,
  Trophy
} from 'lucide-react';
import { useShop } from '@/hooks/useShop';
import { cn } from '@/lib/utils';
import { RewardCelebration } from '@/components/RewardCelebration';

// Format time remaining
function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Ready!';
  
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export function DailyRewardsSection() {
  const { dailyRewardsStatus, claimDailyReward, dailyRewardConfig } = useShop();
  const [showCelebration, setShowCelebration] = useState(false);
  const [claimedReward, setClaimedReward] = useState<{ coins: number; cards: number } | null>(null);
  const [timeDisplay, setTimeDisplay] = useState('');
  
  // Update countdown every second
  useEffect(() => {
    const updateTime = () => {
      setTimeDisplay(formatTimeRemaining(dailyRewardsStatus.timeUntilNext));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [dailyRewardsStatus.timeUntilNext]);
  
  const handleClaim = () => {
    const result = claimDailyReward();
    if (result.success) {
      setClaimedReward({
        coins: dailyRewardsStatus.nextReward.coins,
        cards: dailyRewardsStatus.nextReward.unlockCards,
      });
      setShowCelebration(true);
    }
  };
  
  if (!dailyRewardConfig.enabled) {
    return (
      <Card className="glass border-border/30">
        <CardContent className="py-12 text-center">
          <Gift className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Daily rewards are currently unavailable</p>
        </CardContent>
      </Card>
    );
  }
  
  const streakMilestones = [7, 14, 30];
  const nextMilestone = streakMilestones.find(m => m > dailyRewardsStatus.streak) || 30;
  const progressToMilestone = (dailyRewardsStatus.streak / nextMilestone) * 100;
  
  return (
    <>
      <div className="space-y-6">
        {/* Main Claim Card */}
        <Card className={cn(
          "glass-intense border-2 overflow-hidden transition-all duration-500",
          dailyRewardsStatus.canClaim 
            ? "border-primary/50 animate-pulse-ring" 
            : "border-border/30"
        )}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
          
          <CardContent className="relative p-6">
            <div className="text-center">
              {/* Status Icon */}
              <div className={cn(
                "w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center",
                dailyRewardsStatus.canClaim
                  ? "bg-gradient-to-br from-primary to-accent animate-bounce-slow"
                  : "bg-secondary/50"
              )}>
                {dailyRewardsStatus.canClaim ? (
                  <Gift className="w-10 h-10 text-primary-foreground" />
                ) : (
                  <Clock className="w-10 h-10 text-muted-foreground" />
                )}
              </div>
              
              {/* Title */}
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {dailyRewardsStatus.canClaim ? 'Daily Reward Ready!' : 'Come Back Later'}
              </h2>
              
              {/* Countdown or Claim Button */}
              {dailyRewardsStatus.canClaim ? (
                <div className="space-y-4">
                  {/* Reward Preview */}
                  <div className="flex items-center justify-center gap-4">
                    {dailyRewardsStatus.nextReward.coins > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/20 border border-yellow-500/30">
                        <Coins className="w-5 h-5 text-yellow-400" />
                        <span className="font-bold text-foreground">+{dailyRewardsStatus.nextReward.coins}</span>
                      </div>
                    )}
                    {dailyRewardsStatus.nextReward.unlockCards > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30">
                        <CreditCard className="w-5 h-5 text-green-400" />
                        <span className="font-bold text-foreground">+{dailyRewardsStatus.nextReward.unlockCards}</span>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    size="lg"
                    onClick={handleClaim}
                    className="gap-2 px-8 py-6 text-lg animate-wiggle bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  >
                    <Sparkles className="w-5 h-5" />
                    Claim Reward
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-muted-foreground">Next reward in:</p>
                  <div className="text-4xl font-bold text-primary font-mono">
                    {timeDisplay}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Streak Card */}
        <Card className="glass border-border/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              Your Streak
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Streak */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-500/30 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{dailyRewardsStatus.streak}</p>
                  <p className="text-sm text-muted-foreground">Day Streak</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">{dailyRewardsStatus.totalClaims}</p>
                <p className="text-sm text-muted-foreground">Total Claims</p>
              </div>
            </div>
            
            {/* Progress to Next Milestone */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress to Day {nextMilestone}</span>
                <Badge variant="secondary" className="gap-1">
                  <Trophy className="w-3 h-3" />
                  Bonus Reward
                </Badge>
              </div>
              <div className="h-3 rounded-full bg-secondary/50 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-primary transition-all duration-500"
                  style={{ width: `${Math.min(progressToMilestone, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {nextMilestone - dailyRewardsStatus.streak} days until bonus reward
              </p>
            </div>
            
            {/* 7-Day Calendar */}
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }, (_, i) => {
                const day = i + 1;
                const isCompleted = dailyRewardsStatus.streak >= day;
                const isCurrent = dailyRewardsStatus.streak === i;
                const isNext = dailyRewardsStatus.streak === i && dailyRewardsStatus.canClaim;
                
                return (
                  <div
                    key={day}
                    className={cn(
                      "aspect-square rounded-xl flex flex-col items-center justify-center text-xs transition-all",
                      isCompleted
                        ? "bg-gradient-to-br from-green-500/30 to-green-600/20 border border-green-500/50"
                        : isNext
                        ? "bg-primary/20 border-2 border-primary animate-pulse"
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
                      <Gift className={cn(
                        "w-3 h-3",
                        isNext ? "text-primary" : "text-muted-foreground"
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Streak Bonus Info */}
            {dailyRewardConfig.streakBonusEnabled && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-3">
                <Star className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Streak Bonus Active</p>
                  <p className="text-muted-foreground">
                    Every 7 days, get {dailyRewardConfig.streakBonusMultiplier}x rewards + bonus coins & cards!
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Celebration */}
      <RewardCelebration 
        show={showCelebration} 
        message={claimedReward 
          ? `+${claimedReward.coins} Coins, +${claimedReward.cards} Cards!`
          : 'Daily Reward Claimed!'
        }
        onComplete={() => setShowCelebration(false)} 
      />
    </>
  );
}

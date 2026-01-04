import { useState, useEffect } from 'react';
import { Calendar, Gift, Flame, Star, Trophy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// DB CHANGE NEEDED: Create 'daily_rewards' table with columns:
// - id (uuid), session_id (text), day (integer 1-7), claimed_at (timestamp), streak (integer)
// DB CHANGE NEEDED: Create 'user_rewards' table with columns:
// - id (uuid), session_id (text), reward_type (text), amount (integer), expires_at (timestamp)

const STORAGE_KEY = 'adnexus_daily_rewards';

interface DailyRewardsData {
  lastClaimDate: string | null;
  currentStreak: number;
  totalDaysClaimed: number;
  todayClaimed: boolean;
  bonusUnlocks: number;
}

const STREAK_REWARDS = [
  { day: 1, reward: 1, label: '1 Unlock' },
  { day: 2, reward: 1, label: '1 Unlock' },
  { day: 3, reward: 2, label: '2 Unlocks' },
  { day: 4, reward: 1, label: '1 Unlock' },
  { day: 5, reward: 2, label: '2 Unlocks' },
  { day: 6, reward: 2, label: '2 Unlocks' },
  { day: 7, reward: 5, label: '5 Unlocks!' },
];

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterday(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
}

function getDailyRewardsData(): DailyRewardsData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as DailyRewardsData;
      const today = getToday();
      
      // Check if streak should reset (missed a day)
      if (data.lastClaimDate && data.lastClaimDate !== today && data.lastClaimDate !== getYesterday()) {
        data.currentStreak = 0;
      }
      
      // Check if already claimed today
      data.todayClaimed = data.lastClaimDate === today;
      
      return data;
    }
  } catch {}
  
  return {
    lastClaimDate: null,
    currentStreak: 0,
    totalDaysClaimed: 0,
    todayClaimed: false,
    bonusUnlocks: 0,
  };
}

function saveDailyRewardsData(data: DailyRewardsData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useDailyRewards() {
  const [data, setData] = useState<DailyRewardsData>(getDailyRewardsData);
  
  useEffect(() => {
    setData(getDailyRewardsData());
  }, []);
  
  const claimReward = () => {
    if (data.todayClaimed) {
      toast.error('Already claimed today!');
      return 0;
    }
    
    const today = getToday();
    const isConsecutive = data.lastClaimDate === getYesterday();
    const newStreak = isConsecutive ? (data.currentStreak % 7) + 1 : 1;
    const reward = STREAK_REWARDS[newStreak - 1].reward;
    
    const newData: DailyRewardsData = {
      lastClaimDate: today,
      currentStreak: newStreak,
      totalDaysClaimed: data.totalDaysClaimed + 1,
      todayClaimed: true,
      bonusUnlocks: data.bonusUnlocks + reward,
    };
    
    saveDailyRewardsData(newData);
    setData(newData);
    
    toast.success(`Day ${newStreak} reward claimed! +${reward} bonus unlock${reward > 1 ? 's' : ''}!`);
    return reward;
  };
  
  const useBonusUnlock = () => {
    if (data.bonusUnlocks > 0) {
      const newData = { ...data, bonusUnlocks: data.bonusUnlocks - 1 };
      saveDailyRewardsData(newData);
      setData(newData);
      return true;
    }
    return false;
  };
  
  return {
    ...data,
    claimReward,
    useBonusUnlock,
    currentDayReward: STREAK_REWARDS[data.currentStreak % 7],
    nextDayReward: STREAK_REWARDS[(data.currentStreak + 1) % 7 || 0],
  };
}

interface DailyRewardsWidgetProps {
  variant?: 'compact' | 'full';
}

export function DailyRewardsWidget({ variant = 'compact' }: DailyRewardsWidgetProps) {
  const { 
    currentStreak, 
    todayClaimed, 
    bonusUnlocks, 
    claimReward,
    nextDayReward 
  } = useDailyRewards();
  
  if (variant === 'compact') {
    return (
      <div className="glass rounded-xl p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              todayClaimed ? 'bg-green-500/20' : 'bg-primary/20 animate-pulse'
            }`}>
              {todayClaimed ? (
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
              ) : (
                <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                {todayClaimed ? 'Claimed!' : 'Daily Reward'}
              </p>
              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
                <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-orange-400" />
                {currentStreak} day streak
              </div>
            </div>
          </div>
          
          {!todayClaimed ? (
            <Button size="sm" onClick={claimReward} className="gap-1 sm:gap-2 animate-pulse text-xs sm:text-sm px-2 sm:px-3 h-7 sm:h-8 flex-shrink-0">
              <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Claim</span>
            </Button>
          ) : (
            <div className="text-[10px] sm:text-xs text-muted-foreground text-right flex-shrink-0">
              Tomorrow: {nextDayReward.label}
            </div>
          )}
        </div>
        
        {bonusUnlocks > 0 && (
          <div className="mt-2 sm:mt-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs sm:text-sm text-primary">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
              {bonusUnlocks} bonus unlock{bonusUnlocks > 1 ? 's' : ''} available!
            </p>
          </div>
        )}
      </div>
    );
  }
  
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
              <p className="text-2xl font-bold text-foreground">{currentStreak}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-primary">{bonusUnlocks}</p>
            <p className="text-xs text-muted-foreground">Bonus Unlocks</p>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {STREAK_REWARDS.map((day, index) => {
            const isPast = index < currentStreak;
            const isCurrent = index === currentStreak;
            const isToday = isCurrent && !todayClaimed;
            
            return (
              <div
                key={day.day}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all ${
                  isPast
                    ? 'bg-green-500/20 border border-green-500/30'
                    : isCurrent
                    ? todayClaimed
                      ? 'bg-green-500/20 border border-green-500/30'
                      : 'bg-primary/20 border border-primary/50 animate-pulse'
                    : 'bg-secondary/30 border border-border/30'
                }`}
              >
                <span className={`font-bold ${isPast || (isCurrent && todayClaimed) ? 'text-green-400' : isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                  {day.day}
                </span>
                {isPast || (isCurrent && todayClaimed) ? (
                  <Check className="w-3 h-3 text-green-400" />
                ) : (
                  <Gift className={`w-3 h-3 ${isToday ? 'text-primary' : 'text-muted-foreground'}`} />
                )}
              </div>
            );
          })}
        </div>
        
        {!todayClaimed ? (
          <Button onClick={claimReward} className="w-full gap-2">
            <Gift className="w-4 h-4" />
            Claim Day {(currentStreak % 7) + 1} Reward (+{STREAK_REWARDS[currentStreak % 7].reward} unlock{STREAK_REWARDS[currentStreak % 7].reward > 1 ? 's' : ''})
          </Button>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            Come back tomorrow for Day {((currentStreak) % 7) + 1} reward!
          </p>
        )}
      </CardContent>
    </Card>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Coins, 
  CreditCard, 
  TrendingDown, 
  ChevronDown,
  Gift,
  Zap,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useReferral } from '@/hooks/useReferral';
import { cn } from '@/lib/utils';

export function UserBalance() {
  const { 
    coins, 
    bonusUnlocks, 
    adsReduction, 
    config,
    isLoading 
  } = useReferral();
  
  const [open, setOpen] = useState(false);
  const [coinAnimation, setCoinAnimation] = useState<'increase' | 'decrease' | null>(null);
  const [cardAnimation, setCardAnimation] = useState<'increase' | 'decrease' | null>(null);
  const prevCoins = useRef(coins);
  const prevCards = useRef(bonusUnlocks);
  
  // Detect balance changes and trigger animations
  useEffect(() => {
    if (prevCoins.current !== coins && !isLoading) {
      setCoinAnimation(coins > prevCoins.current ? 'increase' : 'decrease');
      const timer = setTimeout(() => setCoinAnimation(null), 600);
      prevCoins.current = coins;
      return () => clearTimeout(timer);
    }
  }, [coins, isLoading]);
  
  useEffect(() => {
    if (prevCards.current !== bonusUnlocks && !isLoading) {
      setCardAnimation(bonusUnlocks > prevCards.current ? 'increase' : 'decrease');
      const timer = setTimeout(() => setCardAnimation(null), 600);
      prevCards.current = bonusUnlocks;
      return () => clearTimeout(timer);
    }
  }, [bonusUnlocks, isLoading]);
  
  if (isLoading) {
    return (
      <div className="h-9 w-24 rounded-lg bg-muted animate-pulse" />
    );
  }
  
  const hasRewards = coins > 0 || bonusUnlocks > 0 || adsReduction > 0;
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className={cn(
            "gap-1.5 sm:gap-2 px-2 sm:px-3 h-8 sm:h-9 rounded-lg transition-all text-xs sm:text-sm",
            hasRewards 
              ? "bg-gradient-to-r from-yellow-500/10 to-primary/10 border border-yellow-500/20 hover:border-yellow-500/40" 
              : "bg-secondary/50 hover:bg-secondary"
          )}
        >
          <div className="flex items-center gap-1 sm:gap-2">
            <Coins className={cn(
              "w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 transition-transform",
              coinAnimation && "animate-balance-pulse"
            )} />
            <span className={cn(
              "font-semibold text-foreground transition-all",
              coinAnimation === 'decrease' && "animate-balance-decrease",
              coinAnimation === 'increase' && "animate-balance-increase"
            )}>
              {coins}
            </span>
          </div>
          {bonusUnlocks > 0 && (
            <>
              <div className="w-px h-3 sm:h-4 bg-border" />
              <div className="flex items-center gap-1">
                <CreditCard className={cn(
                  "w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 transition-transform",
                  cardAnimation && "animate-balance-pulse"
                )} />
                <span className={cn(
                  "font-semibold text-foreground transition-all",
                  cardAnimation === 'decrease' && "animate-balance-decrease",
                  cardAnimation === 'increase' && "animate-balance-increase"
                )}>
                  {bonusUnlocks}
                </span>
              </div>
            </>
          )}
          <ChevronDown className={cn(
            "w-3 h-3 text-muted-foreground transition-transform hidden sm:block",
            open && "rotate-180"
          )} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] sm:w-72 max-w-72 p-0" align="end" sideOffset={8}>
        <div className="p-4 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
          <h4 className="font-semibold text-foreground mb-1">Your Rewards</h4>
          <p className="text-xs text-muted-foreground">Use rewards to unlock content faster</p>
        </div>
        
        <div className="p-3 space-y-2">
          {/* Coins */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Coins className="w-4 h-4 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{coins} Coins</p>
                <p className="text-xs text-muted-foreground">Skip ads or buy unlocks</p>
              </div>
            </div>
          </div>
          
          {/* Unlock Cards */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{bonusUnlocks} Unlock Cards</p>
                <p className="text-xs text-muted-foreground">Instant full unlock</p>
              </div>
            </div>
          </div>
          
          {/* Ads Reduction */}
          {adsReduction > 0 && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{adsReduction}% Less Ads</p>
                  <p className="text-xs text-muted-foreground">Permanent discount</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-3 pt-0 space-y-2">
          {/* Spending Info */}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs font-medium text-foreground mb-2">How to use:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-primary" />
                <span><strong>{config.coinsPerAdSkip || 50}</strong> coins = Skip 1 ad</span>
              </li>
              <li className="flex items-center gap-2">
                <CreditCard className="w-3 h-3 text-green-400" />
                <span><strong>1</strong> unlock card = Full unlock</span>
              </li>
              <li className="flex items-center gap-2">
                <Coins className="w-3 h-3 text-yellow-400" />
                <span><strong>{config.coinsForFullUnlock || 200}</strong> coins = Full unlock</span>
              </li>
            </ul>
          </div>
          
          {/* Earn More Link */}
          <Link to="/rewards" onClick={() => setOpen(false)}>
            <Button variant="outline" size="sm" className="w-full gap-2 group">
              <Gift className="w-4 h-4 group-hover:animate-wiggle" />
              Earn More Rewards
              <ArrowRight className="w-3 h-3 ml-auto group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

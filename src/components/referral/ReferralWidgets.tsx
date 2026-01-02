import { useState, useEffect } from 'react';
import { 
  Share2, 
  Copy, 
  Gift, 
  Users, 
  Check, 
  Trophy,
  Coins,
  Sparkles,
  Shield,
  Zap,
  ArrowRight,
  Star,
  Clock,
  TrendingUp,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useReferral } from '@/hooks/useReferral';
import { cn } from '@/lib/utils';

// Confetti animation component
function Confetti({ show }: { show: boolean }) {
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 0.5}s`,
            backgroundColor: ['#00d4ff', '#7b61ff', '#ff6b6b', '#ffd93d', '#6bcf63'][Math.floor(Math.random() * 5)],
            width: '10px',
            height: '10px',
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
          }}
        />
      ))}
    </div>
  );
}

// Animated counter component
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const stepDuration = duration / steps;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, stepDuration);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return <span>{displayValue}{suffix}</span>;
}

// Compact widget for homepage
export function ReferralWidgetCompact() {
  const { 
    copyReferralLink, 
    bonusUnlocks, 
    coins,
    totalReferrals,
    isLoading 
  } = useReferral();
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    await copyReferralLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  if (isLoading) {
    return (
      <div className="glass rounded-xl p-4 animate-pulse">
        <div className="h-16 bg-muted rounded" />
      </div>
    );
  }
  
  return (
    <div className="glass rounded-xl p-4 hover:border-primary/30 transition-all duration-300">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center relative">
            <Gift className="w-5 h-5 text-primary" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Invite & Earn</p>
            <p className="text-xs text-muted-foreground">Get free unlocks!</p>
          </div>
        </div>
        <Button 
          size="sm" 
          onClick={handleCopy} 
          className={cn(
            "gap-2 transition-all",
            copied && "bg-green-500 hover:bg-green-600"
          )}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </Button>
      </div>
      
      {(bonusUnlocks > 0 || coins > 0) && (
        <div className="mt-3 flex gap-2">
          {bonusUnlocks > 0 && (
            <div className="flex-1 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-xs text-green-400 flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                {bonusUnlocks} bonus unlock{bonusUnlocks > 1 ? 's' : ''}
              </p>
            </div>
          )}
          {coins > 0 && (
            <div className="flex-1 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-xs text-yellow-400 flex items-center gap-1">
                <Coins className="w-3 h-3" />
                {coins} coins
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Full referral page/section
export function ReferralSection() {
  const { 
    displayCode,
    referralLink,
    copyReferralLink,
    totalReferrals,
    validReferrals,
    coins,
    bonusUnlocks,
    adsReduction,
    hasPriorityUnlock,
    buyUnlockWithCoins,
    buyPriorityUnlock,
    config,
    isLoading,
  } = useReferral();
  
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const handleCopy = async () => {
    await copyReferralLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleBuyUnlock = () => {
    if (buyUnlockWithCoins()) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };
  
  if (isLoading) {
    return (
      <div className="glass-intense rounded-2xl p-8 animate-pulse">
        <div className="h-64 bg-muted rounded" />
      </div>
    );
  }
  
  const nextRewardProgress = (totalReferrals % 5) * 20;
  const referralsToNextReward = 5 - (totalReferrals % 5);
  
  return (
    <div className="space-y-6">
      <Confetti show={showConfetti} />
      
      {/* Hero Section */}
      <Card className="glass-intense border-primary/20 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <CardHeader className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-neon flex items-center justify-center">
              <Share2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl">Referral Program</CardTitle>
              <p className="text-sm text-muted-foreground">Invite friends, earn rewards</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Shield className="w-4 h-4 text-green-400" />
            <span className="text-xs text-green-400 font-medium">Anti-Fraud Protected</span>
          </div>
        </CardHeader>
        <CardContent className="relative space-y-6">
          {/* Referral Link */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Your Referral Link</label>
            <div className="flex gap-2">
              <div className="flex-1 p-3 rounded-xl bg-background/50 border border-border font-mono text-sm text-foreground truncate">
                {referralLink}
              </div>
              <Button 
                onClick={handleCopy} 
                className={cn(
                  "gap-2 px-6 transition-all",
                  copied && "bg-green-500 hover:bg-green-600"
                )}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Your code: <span className="font-mono text-primary font-semibold">{displayCode}</span>
            </p>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-secondary/50 text-center group hover:bg-secondary/70 transition-all">
              <Users className="w-6 h-6 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-2xl font-bold text-foreground">
                <AnimatedCounter value={totalReferrals} />
              </p>
              <p className="text-xs text-muted-foreground">Total Referrals</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/50 text-center group hover:bg-secondary/70 transition-all">
              <Coins className="w-6 h-6 text-yellow-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-2xl font-bold text-foreground">
                <AnimatedCounter value={coins} />
              </p>
              <p className="text-xs text-muted-foreground">Coins Earned</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/50 text-center group hover:bg-secondary/70 transition-all">
              <Gift className="w-6 h-6 text-green-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-2xl font-bold text-foreground">
                <AnimatedCounter value={bonusUnlocks} />
              </p>
              <p className="text-xs text-muted-foreground">Bonus Unlocks</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/50 text-center group hover:bg-secondary/70 transition-all">
              <TrendingUp className="w-6 h-6 text-accent mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-2xl font-bold text-foreground">
                <AnimatedCounter value={adsReduction} suffix="%" />
              </p>
              <p className="text-xs text-muted-foreground">Ads Reduction</p>
            </div>
          </div>
          
          {/* Progress to Next Reward */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Next Milestone Reward</span>
              <span className="text-xs text-primary">{referralsToNextReward} more referrals</span>
            </div>
            <Progress value={nextRewardProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              <Sparkles className="w-3 h-3 inline mr-1" />
              Reach 5 referrals for a special bonus!
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Rewards Shop */}
      <Card className="glass border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            Rewards Shop
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Buy Unlock */}
            <div className="p-4 rounded-xl border border-border bg-secondary/30 hover:border-primary/50 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Bonus Unlock</p>
                  <p className="text-xs text-muted-foreground">{config.coinsToUnlock} coins</p>
                </div>
              </div>
              <Button 
                onClick={handleBuyUnlock}
                disabled={coins < config.coinsToUnlock}
                className="w-full gap-2"
                variant={coins >= config.coinsToUnlock ? "default" : "secondary"}
              >
                <Coins className="w-4 h-4" />
                Purchase
              </Button>
            </div>
            
            {/* Priority Unlock */}
            <div className="p-4 rounded-xl border border-border bg-secondary/30 hover:border-primary/50 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Priority Access</p>
                  <p className="text-xs text-muted-foreground">{config.priorityUnlockCoins} coins</p>
                </div>
              </div>
              <Button 
                onClick={buyPriorityUnlock}
                disabled={coins < config.priorityUnlockCoins || hasPriorityUnlock}
                className="w-full gap-2"
                variant={coins >= config.priorityUnlockCoins ? "default" : "secondary"}
              >
                {hasPriorityUnlock ? (
                  <>
                    <Check className="w-4 h-4" />
                    Active
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4" />
                    24h Access
                  </>
                )}
              </Button>
            </div>
            
            {/* Coming Soon */}
            <div className="p-4 rounded-xl border border-dashed border-border bg-secondary/10 opacity-60">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">More Rewards</p>
                  <p className="text-xs text-muted-foreground">Coming soon</p>
                </div>
              </div>
              <Button disabled className="w-full gap-2" variant="secondary">
                <ArrowRight className="w-4 h-4" />
                Stay Tuned
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* How It Works */}
      <Card className="glass border-border/30">
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4 relative">
                <span className="text-2xl font-bold text-primary">1</span>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Share2 className="w-3 h-3" />
                </div>
              </div>
              <h4 className="font-semibold text-foreground mb-2">Share Your Link</h4>
              <p className="text-sm text-muted-foreground">
                Copy your unique referral link and share it with friends
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mx-auto mb-4 relative">
                <span className="text-2xl font-bold text-accent">2</span>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                  <Users className="w-3 h-3" />
                </div>
              </div>
              <h4 className="font-semibold text-foreground mb-2">Friends Join</h4>
              <p className="text-sm text-muted-foreground">
                When friends sign up using your link, they get a bonus too!
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center mx-auto mb-4 relative">
                <span className="text-2xl font-bold text-green-400">3</span>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center">
                  <Gift className="w-3 h-3" />
                </div>
              </div>
              <h4 className="font-semibold text-foreground mb-2">Earn Rewards</h4>
              <p className="text-sm text-muted-foreground">
                Get coins, bonus unlocks, and reduced ads for each referral
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Rewards Info */}
      <Card className="glass border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Reward Tiers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">1</div>
                <span className="text-foreground">Per Referral</span>
              </div>
              <div className="text-right">
                <span className="text-primary font-semibold">{config.coinsPerReferral} coins</span>
                <span className="text-muted-foreground"> + </span>
                <span className="text-green-400 font-semibold">{config.bonusUnlocksPerReferral} unlock</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-accent">5</div>
                <span className="text-foreground">5 Referrals</span>
              </div>
              <div className="text-right">
                <span className="text-accent font-semibold">Milestone Bonus!</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-sm font-bold text-yellow-400">∞</div>
                <span className="text-foreground">Ads Reduction</span>
              </div>
              <div className="text-right">
                <span className="text-yellow-400 font-semibold">Up to {config.maxAdsReduction}% off</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Export for backward compatibility
export { ReferralWidgetCompact as ReferralWidget };

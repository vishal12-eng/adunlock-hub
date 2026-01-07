import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart3, 
  Coins, 
  CreditCard, 
  ShoppingBag,
  Gift,
  TrendingDown,
  TrendingUp,
  Target
} from 'lucide-react';
import { useShop } from '@/hooks/useShop';
import { cn } from '@/lib/utils';

export function ShopStats() {
  const { stats, coins, unlockCards } = useShop();
  
  const statCards = [
    {
      label: 'Total Coins Earned',
      value: stats.totalCoinsEarned,
      icon: Coins,
      color: 'text-yellow-400',
      bg: 'from-yellow-500/20 to-yellow-600/10',
      border: 'border-yellow-500/30',
    },
    {
      label: 'Total Coins Spent',
      value: stats.totalCoinsSpent,
      icon: TrendingDown,
      color: 'text-red-400',
      bg: 'from-red-500/20 to-red-600/10',
      border: 'border-red-500/30',
    },
    {
      label: 'Unlock Cards Earned',
      value: stats.totalUnlockCardsEarned,
      icon: CreditCard,
      color: 'text-green-400',
      bg: 'from-green-500/20 to-green-600/10',
      border: 'border-green-500/30',
    },
    {
      label: 'Unlock Cards Used',
      value: stats.totalUnlockCardsUsed,
      icon: Target,
      color: 'text-accent',
      bg: 'from-accent/20 to-accent/10',
      border: 'border-accent/30',
    },
    {
      label: 'Shop Purchases',
      value: stats.shopPurchases,
      icon: ShoppingBag,
      color: 'text-primary',
      bg: 'from-primary/20 to-primary/10',
      border: 'border-primary/30',
    },
    {
      label: 'Daily Rewards Claimed',
      value: stats.dailyRewardsClaimed,
      icon: Gift,
      color: 'text-orange-400',
      bg: 'from-orange-500/20 to-orange-600/10',
      border: 'border-orange-500/30',
    },
  ];
  
  const netCoins = stats.totalCoinsEarned - stats.totalCoinsSpent;
  const netCards = stats.totalUnlockCardsEarned - stats.totalUnlockCardsUsed;
  
  return (
    <div className="space-y-6">
      {/* Net Summary */}
      <Card className="glass-intense border-primary/20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Lifetime Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
              <div className="flex items-center gap-2 mb-2">
                {netCoins >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                )}
                <span className="text-sm text-muted-foreground">Net Coins</span>
              </div>
              <p className={cn(
                "text-2xl font-bold",
                netCoins >= 0 ? "text-green-400" : "text-red-400"
              )}>
                {netCoins >= 0 ? '+' : ''}{netCoins}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Current: {coins} coins
              </p>
            </div>
            
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
              <div className="flex items-center gap-2 mb-2">
                {netCards >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                )}
                <span className="text-sm text-muted-foreground">Net Cards</span>
              </div>
              <p className={cn(
                "text-2xl font-bold",
                netCards >= 0 ? "text-green-400" : "text-red-400"
              )}>
                {netCards >= 0 ? '+' : ''}{netCards}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Current: {unlockCards} cards
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Detailed Stats */}
      <Card className="glass border-border/30">
        <CardHeader>
          <CardTitle>Detailed Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {statCards.map((stat) => (
              <div
                key={stat.label}
                className={cn(
                  "p-4 rounded-xl bg-gradient-to-br border transition-all hover:scale-[1.02]",
                  stat.bg,
                  stat.border
                )}
              >
                <stat.icon className={cn("w-6 h-6 mb-2", stat.color)} />
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Ads Discount Stats */}
      {stats.totalAdsDiscounted > 0 && (
        <Card className="glass border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Ads Saved</p>
                  <p className="text-sm text-muted-foreground">Total ads skipped with coins</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-accent">{stats.totalAdsDiscounted}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

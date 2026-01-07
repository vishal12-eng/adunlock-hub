import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingBag, 
  Coins, 
  CreditCard, 
  Gift,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock
} from 'lucide-react';
import { getTransactionStats, getRecentTransactions, Transaction } from '@/lib/shop/transactions';
import { getDailyRewardsStatus } from '@/lib/shop/dailyRewards';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

export function ShopAnalytics() {
  const [stats, setStats] = useState(() => getTransactionStats());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dailyStats, setDailyStats] = useState({ totalClaims: 0, streak: 0 });
  
  useEffect(() => {
    setStats(getTransactionStats());
    setTransactions(getRecentTransactions(10));
    const status = getDailyRewardsStatus();
    setDailyStats({ totalClaims: status.totalClaims, streak: status.streak });
  }, []);
  
  const statCards = [
    {
      label: 'Total Coins Earned',
      value: stats.totalCoinsEarned,
      icon: Coins,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/20',
    },
    {
      label: 'Total Coins Spent',
      value: stats.totalCoinsSpent,
      icon: TrendingDown,
      color: 'text-red-400',
      bg: 'bg-red-500/20',
    },
    {
      label: 'Unlock Cards Earned',
      value: stats.totalUnlockCardsEarned,
      icon: CreditCard,
      color: 'text-green-400',
      bg: 'bg-green-500/20',
    },
    {
      label: 'Unlock Cards Used',
      value: stats.totalUnlockCardsUsed,
      icon: CreditCard,
      color: 'text-accent',
      bg: 'bg-accent/20',
    },
    {
      label: 'Shop Purchases',
      value: stats.shopPurchases,
      icon: ShoppingBag,
      color: 'text-primary',
      bg: 'bg-primary/20',
    },
    {
      label: 'Daily Rewards Claimed',
      value: stats.dailyRewardsClaimed,
      icon: Gift,
      color: 'text-orange-400',
      bg: 'bg-orange-500/20',
    },
  ];
  
  const netCoins = stats.totalCoinsEarned - stats.totalCoinsSpent;
  
  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="glass">
            <CardContent className="p-4">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", stat.bg)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Net Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-5 h-5 text-primary" />
              Economy Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <span className="text-sm text-muted-foreground">Net Coin Flow</span>
                <div className="flex items-center gap-2">
                  {netCoins >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                  <span className={cn(
                    "font-bold",
                    netCoins >= 0 ? "text-green-400" : "text-red-400"
                  )}>
                    {netCoins >= 0 ? '+' : ''}{netCoins}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <span className="text-sm text-muted-foreground">Ads Discounted</span>
                <span className="font-bold text-foreground">{stats.totalAdsDiscounted}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <span className="text-sm text-muted-foreground">Current Streak</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-orange-400">{dailyStats.streak} days</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="w-5 h-5 text-accent" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No transactions yet
              </p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {transactions.slice(0, 5).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-secondary/20"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground truncate">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {tx.coinsChange !== 0 && (
                        <Badge variant={tx.coinsChange > 0 ? "default" : "destructive"} className="text-xs">
                          {tx.coinsChange > 0 ? '+' : ''}{tx.coinsChange}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Tips */}
      <Card className="glass">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Shop Optimization Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium text-foreground mb-1">Adjust Pricing</p>
              <p className="text-xs text-muted-foreground">
                If shop purchases are low, consider reducing coin costs for unlock cards.
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium text-foreground mb-1">Increase Rewards</p>
              <p className="text-xs text-muted-foreground">
                Higher daily rewards = more engagement. Balance with coin economy.
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium text-foreground mb-1">Monitor Balance</p>
              <p className="text-xs text-muted-foreground">
                Keep net coin flow slightly negative to encourage ad watching.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

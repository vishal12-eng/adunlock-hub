import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  History, 
  Coins, 
  CreditCard, 
  ShoppingBag,
  Gift,
  Zap,
  TrendingDown,
  Users,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useShop } from '@/hooks/useShop';
import { Transaction, TransactionType } from '@/lib/shop/transactions';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

// Get icon for transaction type
function getTransactionIcon(type: TransactionType) {
  switch (type) {
    case 'shop_purchase':
      return <ShoppingBag className="w-4 h-4" />;
    case 'daily_reward':
      return <Gift className="w-4 h-4" />;
    case 'ad_discount':
      return <TrendingDown className="w-4 h-4" />;
    case 'referral_bonus':
    case 'welcome_bonus':
      return <Users className="w-4 h-4" />;
    case 'unlock_used':
    case 'full_unlock':
      return <CreditCard className="w-4 h-4" />;
    case 'ad_skip':
    case 'coins_spent':
      return <Zap className="w-4 h-4" />;
    case 'subscription_bonus':
      return <Coins className="w-4 h-4" />;
    default:
      return <Coins className="w-4 h-4" />;
  }
}

// Get badge variant for transaction type
function getTransactionBadge(type: TransactionType): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  switch (type) {
    case 'shop_purchase':
      return { label: 'Shop', variant: 'default' };
    case 'daily_reward':
      return { label: 'Daily', variant: 'secondary' };
    case 'ad_discount':
      return { label: 'Discount', variant: 'outline' };
    case 'referral_bonus':
      return { label: 'Referral', variant: 'default' };
    case 'welcome_bonus':
      return { label: 'Welcome', variant: 'secondary' };
    case 'unlock_used':
      return { label: 'Unlock', variant: 'destructive' };
    case 'full_unlock':
      return { label: 'Full Unlock', variant: 'destructive' };
    case 'ad_skip':
      return { label: 'Skip Ad', variant: 'outline' };
    case 'coins_spent':
      return { label: 'Spent', variant: 'destructive' };
    case 'subscription_bonus':
      return { label: 'Subscription', variant: 'default' };
    default:
      return { label: 'Other', variant: 'outline' };
  }
}

function TransactionItem({ transaction }: { transaction: Transaction }) {
  const badge = getTransactionBadge(transaction.type);
  const isPositive = transaction.coinsChange > 0 || transaction.unlockCardsChange > 0;
  const isNegative = transaction.coinsChange < 0 || transaction.unlockCardsChange < 0;
  
  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-xl transition-all hover:bg-secondary/30",
      "border border-transparent hover:border-border/50"
    )}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
          isPositive 
            ? "bg-green-500/20 text-green-400"
            : isNegative
            ? "bg-red-500/20 text-red-400"
            : "bg-secondary/50 text-muted-foreground"
        )}>
          {getTransactionIcon(transaction.type)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {transaction.description}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant={badge.variant} className="text-[10px] px-1.5 py-0">
              {badge.label}
            </Badge>
            <span>{formatDistanceToNow(transaction.timestamp, { addSuffix: true })}</span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {transaction.coinsChange !== 0 && (
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium",
            transaction.coinsChange > 0 ? "text-green-400" : "text-red-400"
          )}>
            {transaction.coinsChange > 0 ? (
              <ArrowUp className="w-3 h-3" />
            ) : (
              <ArrowDown className="w-3 h-3" />
            )}
            <Coins className="w-3 h-3 text-yellow-400" />
            {Math.abs(transaction.coinsChange)}
          </div>
        )}
        {transaction.unlockCardsChange !== 0 && (
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium",
            transaction.unlockCardsChange > 0 ? "text-green-400" : "text-red-400"
          )}>
            {transaction.unlockCardsChange > 0 ? (
              <ArrowUp className="w-3 h-3" />
            ) : (
              <ArrowDown className="w-3 h-3" />
            )}
            <CreditCard className="w-3 h-3 text-green-400" />
            {Math.abs(transaction.unlockCardsChange)}
          </div>
        )}
      </div>
    </div>
  );
}

export function SpendingHistory() {
  const { transactions, refreshTransactions } = useShop();
  
  if (transactions.length === 0) {
    return (
      <Card className="glass border-border/30">
        <CardContent className="py-12 text-center">
          <History className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium text-foreground mb-2">No transactions yet</p>
          <p className="text-sm text-muted-foreground">
            Your spending and earning history will appear here
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Group transactions by date
  const groupedTransactions = transactions.reduce((groups, transaction) => {
    const date = new Date(transaction.timestamp).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);
  
  return (
    <Card className="glass border-border/30">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Transaction History
          </div>
          <Badge variant="secondary">{transactions.length} transactions</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedTransactions).map(([date, dayTransactions]) => (
          <div key={date}>
            <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
              {date === new Date().toLocaleDateString() ? 'Today' : date}
            </p>
            <div className="space-y-1">
              {dayTransactions.map((transaction) => (
                <TransactionItem key={transaction.id} transaction={transaction} />
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

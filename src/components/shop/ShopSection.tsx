import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingBag, 
  CreditCard, 
  Coins, 
  Sparkles,
  Check,
  Loader2
} from 'lucide-react';
import { useShop } from '@/hooks/useShop';
import { ShopItem } from '@/lib/shop/config';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function ShopSection() {
  const { shopConfig, coins, purchaseItem, canAfford } = useShop();
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  
  const handlePurchase = async () => {
    if (!selectedItem) return;
    
    setIsPurchasing(true);
    
    // Simulate brief delay for UX
    await new Promise(r => setTimeout(r, 500));
    
    const success = purchaseItem(selectedItem);
    
    if (success) {
      setPurchaseSuccess(true);
      setTimeout(() => {
        setPurchaseSuccess(false);
        setSelectedItem(null);
      }, 1500);
    } else {
      setSelectedItem(null);
    }
    
    setIsPurchasing(false);
  };
  
  if (!shopConfig.enabled) {
    return (
      <Card className="glass border-border/30">
        <CardContent className="py-12 text-center">
          <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Shop is currently unavailable</p>
        </CardContent>
      </Card>
    );
  }
  
  const enabledItems = shopConfig.items.filter(item => item.enabled);
  
  return (
    <>
      <Card className="glass border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Buy Unlock Cards
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Convert your coins into unlock cards for instant content access
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {enabledItems.map((item, index) => {
              const affordable = canAfford(item.coinsCost);
              const valuePerCard = (item.coinsCost / item.unlockCards).toFixed(0);
              const bestValue = item.badge === 'Best Value';
              
              return (
                <div
                  key={item.id}
                  className={cn(
                    "relative p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer group",
                    "hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10",
                    bestValue
                      ? "border-primary bg-gradient-to-br from-primary/10 via-primary/5 to-transparent"
                      : "border-border/50 bg-secondary/20 hover:border-primary/50",
                    !affordable && "opacity-60 cursor-not-allowed"
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => affordable && setSelectedItem(item)}
                >
                  {/* Badge */}
                  {item.badge && (
                    <Badge 
                      className={cn(
                        "absolute -top-2 -right-2 px-2 py-0.5 text-[10px] font-bold",
                        bestValue 
                          ? "bg-gradient-to-r from-primary to-accent text-primary-foreground animate-pulse"
                          : "bg-accent/80"
                      )}
                    >
                      {item.badge}
                    </Badge>
                  )}
                  
                  {/* Card Icon */}
                  <div className={cn(
                    "w-16 h-16 mx-auto mb-3 rounded-xl flex items-center justify-center",
                    "bg-gradient-to-br transition-transform group-hover:scale-110",
                    bestValue
                      ? "from-primary/30 to-accent/20"
                      : "from-green-500/20 to-green-600/10"
                  )}>
                    <CreditCard className={cn(
                      "w-8 h-8",
                      bestValue ? "text-primary" : "text-green-400"
                    )} />
                    {item.unlockCards > 1 && (
                      <span className="absolute text-xs font-bold text-foreground bg-background/80 px-1.5 py-0.5 rounded-full -bottom-1 -right-1">
                        x{item.unlockCards}
                      </span>
                    )}
                  </div>
                  
                  {/* Name */}
                  <h3 className="font-bold text-foreground text-center mb-1">
                    {item.name}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-xs text-muted-foreground text-center mb-3">
                    {item.description}
                  </p>
                  
                  {/* Price */}
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <Coins className="w-5 h-5 text-yellow-400" />
                    <span className="text-xl font-bold text-foreground">{item.coinsCost}</span>
                  </div>
                  
                  {/* Value per card */}
                  <p className="text-[10px] text-muted-foreground text-center">
                    {valuePerCard} coins per card
                  </p>
                  
                  {/* Buy Button */}
                  <Button
                    className={cn(
                      "w-full mt-3 gap-2",
                      bestValue && "bg-gradient-to-r from-primary to-accent hover:opacity-90"
                    )}
                    size="sm"
                    disabled={!affordable}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (affordable) setSelectedItem(item);
                    }}
                  >
                    {affordable ? (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Buy Now
                      </>
                    ) : (
                      'Not Enough Coins'
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
          
          {/* Current Balance Reminder */}
          <div className="mt-6 p-4 rounded-xl bg-secondary/30 border border-border/30">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Your balance:</span>
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-400" />
                <span className="font-bold text-foreground">{coins} coins</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Purchase Confirmation Dialog */}
      <AlertDialog open={!!selectedItem} onOpenChange={() => !isPurchasing && setSelectedItem(null)}>
        <AlertDialogContent className="glass-intense border-primary/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {purchaseSuccess ? (
                <>
                  <Check className="w-5 h-5 text-green-400" />
                  Purchase Complete!
                </>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  Confirm Purchase
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                {purchaseSuccess ? (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center animate-bounce-in">
                      <Check className="w-8 h-8 text-green-400" />
                    </div>
                    <p className="text-lg font-semibold text-foreground">
                      +{selectedItem?.unlockCards} Unlock Card{selectedItem?.unlockCards !== 1 ? 's' : ''}
                    </p>
                  </div>
                ) : selectedItem && (
                  <>
                    <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-foreground font-medium">{selectedItem.name}</span>
                        <Badge variant="secondary">{selectedItem.unlockCards} cards</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                    </div>
                    
                    <div className="space-y-2 p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Cost:</span>
                        <div className="flex items-center gap-1">
                          <Coins className="w-4 h-4 text-yellow-400" />
                          <span className="font-bold text-foreground">{selectedItem.coinsCost}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Your balance:</span>
                        <span className="text-foreground">{coins} coins</span>
                      </div>
                      <div className="flex items-center justify-between text-sm pt-2 border-t border-border/50">
                        <span className="text-muted-foreground">After purchase:</span>
                        <span className={cn(
                          "font-bold",
                          coins - selectedItem.coinsCost >= 0 ? "text-green-400" : "text-destructive"
                        )}>
                          {coins - selectedItem.coinsCost} coins
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          {!purchaseSuccess && (
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPurchasing}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handlePurchase}
                disabled={isPurchasing}
                className="gap-2"
              >
                {isPurchasing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Confirm Purchase
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

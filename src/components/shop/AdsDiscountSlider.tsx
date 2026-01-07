import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Coins, 
  TrendingDown, 
  Sparkles,
  Check
} from 'lucide-react';
import { useShop } from '@/hooks/useShop';
import { cn } from '@/lib/utils';

interface AdsDiscountSliderProps {
  contentId: string;
  contentTitle?: string;
  originalAds: number;
  onDiscountApplied: (newAdsCount: number, coinsSpent: number) => void;
}

export function AdsDiscountSlider({
  contentId,
  contentTitle,
  originalAds,
  onDiscountApplied,
}: AdsDiscountSliderProps) {
  const { coins, shopConfig, applyAdsDiscount, getDiscountOptions } = useShop();
  const [selectedDiscount, setSelectedDiscount] = useState(0);
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  
  const discountOptions = useMemo(() => {
    return getDiscountOptions(originalAds);
  }, [getDiscountOptions, originalAds]);
  
  const maxDiscount = useMemo(() => {
    if (discountOptions.length === 0) return 0;
    return discountOptions[discountOptions.length - 1].adsToReduce;
  }, [discountOptions]);
  
  const currentOption = useMemo(() => {
    return discountOptions.find(opt => opt.adsToReduce === selectedDiscount);
  }, [discountOptions, selectedDiscount]);
  
  const coinsRequired = selectedDiscount * shopConfig.coinsPerAdDiscount;
  const finalAds = originalAds - selectedDiscount;
  const canAfford = coins >= coinsRequired;
  
  if (!shopConfig.enabled || maxDiscount === 0 || coins < shopConfig.coinsPerAdDiscount) {
    return null;
  }
  
  const handleApply = async () => {
    if (selectedDiscount === 0 || !canAfford || applied) return;
    
    setIsApplying(true);
    const success = applyAdsDiscount(contentId, originalAds, selectedDiscount, contentTitle);
    
    if (success) {
      setApplied(true);
      onDiscountApplied(finalAds, coinsRequired);
    }
    
    setIsApplying(false);
  };
  
  if (applied) {
    return (
      <Card className="glass border-green-500/30 bg-green-500/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-2 text-green-400">
            <Check className="w-5 h-5" />
            <span className="font-medium">
              Discount Applied! Now only {finalAds} ads required
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="glass border-accent/30 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-primary/5" />
      <CardHeader className="relative pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingDown className="w-4 h-4 text-accent" />
          Use Coins to Reduce Ads
          <Sparkles className="w-3 h-3 text-yellow-400" />
        </CardTitle>
      </CardHeader>
      <CardContent className="relative space-y-4">
        {/* Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Ads to reduce:</span>
            <span className="font-bold text-foreground">{selectedDiscount}</span>
          </div>
          <Slider
            value={[selectedDiscount]}
            onValueChange={([value]) => setSelectedDiscount(value)}
            max={maxDiscount}
            step={1}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 (No discount)</span>
            <span>{maxDiscount} ads max</span>
          </div>
        </div>
        
        {/* Preview */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-secondary/30 border border-border/50">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Original</p>
            <p className="text-lg font-bold text-foreground">{originalAds}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Discount</p>
            <p className={cn(
              "text-lg font-bold",
              selectedDiscount > 0 ? "text-accent" : "text-muted-foreground"
            )}>
              -{selectedDiscount}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Final</p>
            <p className={cn(
              "text-lg font-bold",
              selectedDiscount > 0 ? "text-green-400" : "text-foreground"
            )}>
              {finalAds}
            </p>
          </div>
        </div>
        
        {/* Cost & Apply */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-400" />
            <div>
              <p className={cn(
                "font-bold",
                canAfford ? "text-foreground" : "text-destructive"
              )}>
                {coinsRequired} coins
              </p>
              <p className="text-xs text-muted-foreground">
                Balance: {coins}
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleApply}
            disabled={selectedDiscount === 0 || !canAfford || isApplying}
            className={cn(
              "gap-2",
              selectedDiscount > 0 && canAfford && "bg-gradient-to-r from-accent to-primary"
            )}
          >
            {isApplying ? (
              'Applying...'
            ) : selectedDiscount === 0 ? (
              'Select amount'
            ) : !canAfford ? (
              'Not enough coins'
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Apply Discount
              </>
            )}
          </Button>
        </div>
        
        {/* Tip */}
        <p className="text-[10px] text-center text-muted-foreground">
          Tip: {shopConfig.coinsPerAdDiscount} coins = 1 ad reduction • Max {shopConfig.maxAdsDiscountPerSession} ads per session
        </p>
      </CardContent>
    </Card>
  );
}

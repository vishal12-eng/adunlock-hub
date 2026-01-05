import { useState } from 'react';
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
import { Coins, CreditCard, Zap, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SpendType = 'unlock-card' | 'full-unlock' | 'skip-ad';

interface RewardConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  type: SpendType;
  cost: number;
  currentBalance: number;
  isLoading?: boolean;
}

const spendConfig: Record<SpendType, {
  title: string;
  description: string;
  icon: typeof Coins;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  unit: string;
}> = {
  'unlock-card': {
    title: 'Use Unlock Card',
    description: 'Instantly unlock this content with your unlock card',
    icon: CreditCard,
    iconColor: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/30',
    unit: 'card',
  },
  'full-unlock': {
    title: 'Full Unlock with Coins',
    description: 'Use your coins to instantly unlock this content',
    icon: Coins,
    iconColor: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/30',
    unit: 'coins',
  },
  'skip-ad': {
    title: 'Skip Ad with Coins',
    description: 'Skip watching one ad using your coins',
    icon: Zap,
    iconColor: 'text-primary',
    bgColor: 'bg-primary/20',
    borderColor: 'border-primary/30',
    unit: 'coins',
  },
};

export function RewardConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  type,
  cost,
  currentBalance,
  isLoading = false,
}: RewardConfirmDialogProps) {
  const config = spendConfig[type];
  const Icon = config.icon;
  const balanceAfter = currentBalance - cost;
  const isCard = type === 'unlock-card';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm mx-auto">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center animate-bounce-in",
              config.bgColor,
              config.borderColor,
              "border"
            )}>
              <Icon className={cn("w-6 h-6", config.iconColor)} />
            </div>
            <AlertDialogTitle className="text-left text-lg">
              {config.title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            {config.description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Cost breakdown */}
        <div className="my-4 p-4 rounded-xl bg-secondary/50 border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Cost</span>
            <div className="flex items-center gap-1.5">
              <Icon className={cn("w-4 h-4", config.iconColor)} />
              <span className="font-semibold text-foreground">
                {cost} {isCard ? (cost === 1 ? 'card' : 'cards') : 'coins'}
              </span>
            </div>
          </div>
          
          <div className="h-px bg-border" />
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Balance</span>
            <span className="font-medium text-foreground">
              {currentBalance} {isCard ? (currentBalance === 1 ? 'card' : 'cards') : 'coins'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">After Transaction</span>
            <div className="flex items-center gap-2">
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
              <span className={cn(
                "font-semibold",
                balanceAfter > 0 ? "text-green-400" : "text-yellow-400"
              )}>
                {balanceAfter} {isCard ? (balanceAfter === 1 ? 'card' : 'cards') : 'coins'}
              </span>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel 
            className="flex-1" 
            disabled={isLoading}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            className={cn(
              "flex-1 gap-2",
              config.bgColor,
              config.borderColor,
              "border hover:opacity-90"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Icon className={cn("w-4 h-4", config.iconColor)} />
                Confirm
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
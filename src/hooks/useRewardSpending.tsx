import { useState, useCallback } from 'react';
import { useReferral } from '@/hooks/useReferral';
import { toast } from 'sonner';
import { SpendType } from '@/components/RewardConfirmDialog';

interface PendingAction {
  type: SpendType;
  cost: number;
  balance: number;
  onSuccess: () => void;
}

interface UseRewardSpendingReturn {
  // State
  pendingAction: PendingAction | null;
  isConfirmOpen: boolean;
  isProcessing: boolean;
  showCelebration: boolean;
  celebrationMessage: string;
  
  // Actions
  requestUnlockCard: (onSuccess: () => void) => void;
  requestFullUnlock: (onSuccess: () => void) => void;
  requestSkipAd: (onSuccess: () => void) => void;
  confirmAction: () => void;
  cancelAction: () => void;
  dismissCelebration: () => void;
  
  // Computed
  pendingCost: number;
  balanceAfter: number;
}

export function useRewardSpending(): UseRewardSpendingReturn {
  const { 
    coins, 
    bonusUnlocks, 
    useBonusUnlock, 
    useCoinsToSkipAd,
    useCoinsForFullUnlock,
    config 
  } = useReferral();

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('Content Unlocked!');

  const requestUnlockCard = useCallback((onSuccess: () => void) => {
    if (bonusUnlocks <= 0) {
      toast.error("You don't have any unlock cards");
      return;
    }
    setPendingAction({
      type: 'unlock-card',
      cost: 1,
      balance: bonusUnlocks,
      onSuccess,
    });
    setIsConfirmOpen(true);
  }, [bonusUnlocks]);

  const requestFullUnlock = useCallback((onSuccess: () => void) => {
    if (coins < config.coinsForFullUnlock) {
      toast.error(`You need ${config.coinsForFullUnlock} coins for full unlock`);
      return;
    }
    setPendingAction({
      type: 'full-unlock',
      cost: config.coinsForFullUnlock,
      balance: coins,
      onSuccess,
    });
    setIsConfirmOpen(true);
  }, [coins, config.coinsForFullUnlock]);

  const requestSkipAd = useCallback((onSuccess: () => void) => {
    if (coins < config.coinsPerAdSkip) {
      toast.error(`You need ${config.coinsPerAdSkip} coins to skip an ad`);
      return;
    }
    setPendingAction({
      type: 'skip-ad',
      cost: config.coinsPerAdSkip,
      balance: coins,
      onSuccess,
    });
    setIsConfirmOpen(true);
  }, [coins, config.coinsPerAdSkip]);

  const confirmAction = useCallback(() => {
    if (!pendingAction) return;
    
    setIsProcessing(true);
    
    let success = false;
    let message = 'Content Unlocked!';
    
    switch (pendingAction.type) {
      case 'unlock-card':
        success = useBonusUnlock();
        message = 'Unlocked with Card!';
        break;
      case 'full-unlock':
        success = useCoinsForFullUnlock();
        message = 'Full Unlock Complete!';
        break;
      case 'skip-ad':
        success = useCoinsToSkipAd();
        message = 'Ad Skipped!';
        break;
    }
    
    if (success) {
      pendingAction.onSuccess();
      setCelebrationMessage(message);
      setShowCelebration(true);
      toast.success(message);
    } else {
      toast.error('Failed to process reward. Please try again.');
    }
    
    setIsProcessing(false);
    setIsConfirmOpen(false);
    setPendingAction(null);
  }, [pendingAction, useBonusUnlock, useCoinsForFullUnlock, useCoinsToSkipAd]);

  const cancelAction = useCallback(() => {
    setIsConfirmOpen(false);
    setPendingAction(null);
  }, []);

  const dismissCelebration = useCallback(() => {
    setShowCelebration(false);
  }, []);

  return {
    pendingAction,
    isConfirmOpen,
    isProcessing,
    showCelebration,
    celebrationMessage,
    requestUnlockCard,
    requestFullUnlock,
    requestSkipAd,
    confirmAction,
    cancelAction,
    dismissCelebration,
    pendingCost: pendingAction?.cost ?? 0,
    balanceAfter: pendingAction ? pendingAction.balance - pendingAction.cost : 0,
  };
}
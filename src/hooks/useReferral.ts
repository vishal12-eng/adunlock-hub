import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  initializeReferralSystem,
  processIncomingReferral,
  checkReferrerRewards,
  getReferralStats,
  startTimeTracking,
  stopTimeTracking,
  recordContentUnlock,
  useBonusUnlock as useBonusUnlockLib,
  getRewards,
  ReferralSystemData,
  DEFAULT_REWARD_CONFIG,
} from '@/lib/referral';
import {
  purchaseUnlockWithCoins,
  purchasePriorityUnlock,
  getAdsReduction,
  calculateEffectiveAds,
} from '@/lib/referral/rewards';

export interface UseReferralReturn {
  // Referral data
  referralCode: string;
  displayCode: string;
  referralLink: string;
  isReferred: boolean;
  
  // Stats
  totalReferrals: number;
  validReferrals: number;
  coins: number;
  bonusUnlocks: number;
  adsReduction: number;
  hasPriorityUnlock: boolean;
  
  // Actions
  copyReferralLink: () => Promise<void>;
  useBonusUnlock: () => boolean;
  buyUnlockWithCoins: () => boolean;
  buyPriorityUnlock: () => boolean;
  recordUnlock: () => void;
  calculateEffectiveAds: (baseAds: number) => number;
  
  // Config
  config: typeof DEFAULT_REWARD_CONFIG;
  
  // State
  isLoading: boolean;
  isInitialized: boolean;
}

export function useReferral(): UseReferralReturn {
  const [referralData, setReferralData] = useState<ReferralSystemData | null>(null);
  const [stats, setStats] = useState(() => getReferralStats());
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize referral system
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        // Initialize the referral system
        const data = await initializeReferralSystem();
        if (!mounted) return;
        setReferralData(data);

        // Process any incoming referral from URL
        const result = await processIncomingReferral();
        if (result.success && result.reward) {
          toast.success(result.message, {
            description: 'Check your rewards!',
            duration: 5000,
          });
        }

        // Check for new referrer rewards
        const { newRewards } = checkReferrerRewards();
        if (newRewards > 0) {
          toast.success(`You earned ${newRewards} referral reward${newRewards > 1 ? 's' : ''}!`, {
            description: 'Someone you referred completed an unlock!',
            duration: 5000,
          });
        }

        // Update stats
        setStats(getReferralStats());
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize referral system:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    init();

    // Start time tracking for referral validation
    startTimeTracking();

    return () => {
      mounted = false;
      stopTimeTracking();
    };
  }, []);

  // Refresh stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getReferralStats());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const copyReferralLink = useCallback(async () => {
    if (!referralData) return;

    try {
      await navigator.clipboard.writeText(referralData.referralLink);
      toast.success('Referral link copied!', {
        description: 'Share it with friends to earn rewards',
      });
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = referralData.referralLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Referral link copied!');
    }
  }, [referralData]);

  const useBonusUnlock = useCallback(() => {
    const success = useBonusUnlockLib();
    if (success) {
      setStats(getReferralStats());
      toast.success('Bonus unlock used!');
    }
    return success;
  }, []);

  const buyUnlockWithCoins = useCallback(() => {
    const success = purchaseUnlockWithCoins();
    if (success) {
      setStats(getReferralStats());
      toast.success('Purchased 1 bonus unlock!', {
        description: `Cost: ${DEFAULT_REWARD_CONFIG.coinsToUnlock} coins`,
      });
    } else {
      toast.error('Not enough coins');
    }
    return success;
  }, []);

  const buyPriorityUnlock = useCallback(() => {
    const success = purchasePriorityUnlock();
    if (success) {
      setStats(getReferralStats());
      toast.success('Priority unlock activated!', {
        description: '24 hours of priority access',
      });
    } else {
      toast.error('Not enough coins');
    }
    return success;
  }, []);

  const recordUnlock = useCallback(() => {
    recordContentUnlock();
    setStats(getReferralStats());
  }, []);

  return {
    // Referral data
    referralCode: referralData?.myReferralCode || '',
    displayCode: referralData?.myDisplayCode || 'ADX-XXXXXX',
    referralLink: referralData?.referralLink || '',
    isReferred: !!referralData?.referredByCode,

    // Stats
    totalReferrals: stats.totalReferrals,
    validReferrals: stats.validReferrals,
    coins: stats.coins,
    bonusUnlocks: stats.bonusUnlocks,
    adsReduction: stats.adsReduction,
    hasPriorityUnlock: stats.hasPriorityUnlock,

    // Actions
    copyReferralLink,
    useBonusUnlock,
    buyUnlockWithCoins,
    buyPriorityUnlock,
    recordUnlock,
    calculateEffectiveAds,

    // Config
    config: DEFAULT_REWARD_CONFIG,

    // State
    isLoading,
    isInitialized,
  };
}

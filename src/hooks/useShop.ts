import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  getShopConfig,
  ShopConfig,
  ShopItem,
  getDailyRewardConfig,
  DailyRewardConfig,
  getSubscriptionRewardConfig,
  SubscriptionRewardConfig,
} from '@/lib/shop/config';
import {
  addTransaction,
  getRecentTransactions,
  getTransactionStats,
  Transaction,
  TransactionStats,
} from '@/lib/shop/transactions';
import {
  claimDailyReward as claimDailyRewardLib,
  getDailyRewardsStatus,
  canClaimDailyReward,
} from '@/lib/shop/dailyRewards';
import {
  calculateDiscountOptions,
  applyAdsDiscount as applyAdsDiscountLib,
  getEffectiveAdsCount,
} from '@/lib/shop/adsDiscount';
import {
  playCoinSound,
  playCardSound,
  playPurchaseSound,
  playDailyRewardSound,
  playSuccessSound,
  playErrorSound,
  isSoundEnabled,
  setSoundEnabled as setSoundEnabledLib,
} from '@/lib/shop/sounds';
import { getRewards, spendCoins } from '@/lib/referral/rewards';

export interface UseShopReturn {
  // Config
  shopConfig: ShopConfig;
  dailyRewardConfig: DailyRewardConfig;
  subscriptionConfig: SubscriptionRewardConfig;
  
  // Balance
  coins: number;
  unlockCards: number;
  
  // Shop
  purchaseItem: (item: ShopItem) => boolean;
  canAfford: (coinsCost: number) => boolean;
  
  // Daily Rewards
  dailyRewardsStatus: {
    streak: number;
    totalClaims: number;
    canClaim: boolean;
    timeUntilNext: number;
    nextReward: { coins: number; unlockCards: number };
  };
  claimDailyReward: () => { success: boolean; message: string };
  
  // Ads Discount
  getDiscountOptions: (originalAds: number) => { adsToReduce: number; coinsRequired: number; finalAds: number }[];
  applyAdsDiscount: (contentId: string, originalAds: number, adsToReduce: number, contentTitle?: string) => boolean;
  getEffectiveAds: (contentId: string, originalAds: number) => number;
  
  // Transactions
  transactions: Transaction[];
  stats: TransactionStats;
  refreshTransactions: () => void;
  
  // Sound
  soundEnabled: boolean;
  toggleSound: () => void;
  
  // State
  isLoading: boolean;
}

export function useShop(): UseShopReturn {
  const [shopConfig, setShopConfig] = useState<ShopConfig>(getShopConfig());
  const [dailyRewardConfig, setDailyRewardConfig] = useState<DailyRewardConfig>(getDailyRewardConfig());
  const [subscriptionConfig, setSubscriptionConfig] = useState<SubscriptionRewardConfig>(getSubscriptionRewardConfig());
  const [balance, setBalance] = useState(() => getRewards());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats>(() => getTransactionStats());
  const [dailyStatus, setDailyStatus] = useState(() => getDailyRewardsStatus());
  const [soundEnabled, setSoundEnabled] = useState(() => isSoundEnabled());
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize
  useEffect(() => {
    setShopConfig(getShopConfig());
    setDailyRewardConfig(getDailyRewardConfig());
    setSubscriptionConfig(getSubscriptionRewardConfig());
    setBalance(getRewards());
    setTransactions(getRecentTransactions(20));
    setStats(getTransactionStats());
    setDailyStatus(getDailyRewardsStatus());
    setIsLoading(false);
  }, []);
  
  // Refresh balance periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setBalance(getRewards());
      setDailyStatus(getDailyRewardsStatus());
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  
  // Update countdown timer
  useEffect(() => {
    if (!dailyStatus.canClaim && dailyStatus.timeUntilNext > 0) {
      const timer = setInterval(() => {
        setDailyStatus(getDailyRewardsStatus());
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [dailyStatus.canClaim, dailyStatus.timeUntilNext]);
  
  const refreshBalance = useCallback(() => {
    setBalance(getRewards());
  }, []);
  
  const refreshTransactions = useCallback(() => {
    setTransactions(getRecentTransactions(20));
    setStats(getTransactionStats());
  }, []);
  
  const canAfford = useCallback((coinsCost: number) => {
    return balance.coins >= coinsCost;
  }, [balance.coins]);
  
  const purchaseItem = useCallback((item: ShopItem) => {
    if (!canAfford(item.coinsCost)) {
      playErrorSound();
      toast.error('Not enough coins!', {
        description: `You need ${item.coinsCost} coins`,
      });
      return false;
    }
    
    // Spend coins
    const success = spendCoins(item.coinsCost);
    if (!success) {
      playErrorSound();
      toast.error('Purchase failed');
      return false;
    }
    
    // Add unlock cards to balance
    const rewards = getRewards();
    rewards.bonusUnlocks += item.unlockCards;
    localStorage.setItem('adnexus_ref_rewards', JSON.stringify(rewards));
    
    // Record transaction
    addTransaction(
      'shop_purchase',
      `Purchased ${item.name}`,
      -item.coinsCost,
      item.unlockCards,
      undefined,
      undefined,
      { itemId: item.id }
    );
    
    playPurchaseSound();
    playCardSound();
    
    toast.success('Purchase complete!', {
      description: `+${item.unlockCards} Unlock Card${item.unlockCards > 1 ? 's' : ''}`,
    });
    
    refreshBalance();
    refreshTransactions();
    return true;
  }, [canAfford, refreshBalance, refreshTransactions]);
  
  const claimDailyReward = useCallback(() => {
    const result = claimDailyRewardLib(dailyRewardConfig);
    
    if (result.success) {
      // Update rewards in storage
      const rewards = getRewards();
      rewards.coins += result.coinsAwarded;
      rewards.bonusUnlocks += result.unlockCardsAwarded;
      localStorage.setItem('adnexus_ref_rewards', JSON.stringify(rewards));
      
      playDailyRewardSound();
      
      toast.success(result.message, {
        description: `+${result.coinsAwarded} coins, +${result.unlockCardsAwarded} unlock cards`,
      });
      
      refreshBalance();
      refreshTransactions();
      setDailyStatus(getDailyRewardsStatus());
    } else {
      playErrorSound();
      toast.error(result.message);
    }
    
    return { success: result.success, message: result.message };
  }, [dailyRewardConfig, refreshBalance, refreshTransactions]);
  
  const getDiscountOptions = useCallback((originalAds: number) => {
    return calculateDiscountOptions(originalAds, balance.coins);
  }, [balance.coins]);
  
  const applyAdsDiscount = useCallback((
    contentId: string,
    originalAds: number,
    adsToReduce: number,
    contentTitle?: string
  ) => {
    const coinsRequired = adsToReduce * shopConfig.coinsPerAdDiscount;
    
    if (!canAfford(coinsRequired)) {
      playErrorSound();
      toast.error('Not enough coins!');
      return false;
    }
    
    // Spend coins first
    const success = spendCoins(coinsRequired);
    if (!success) {
      playErrorSound();
      toast.error('Failed to apply discount');
      return false;
    }
    
    // Apply discount
    const result = applyAdsDiscountLib(contentId, originalAds, adsToReduce, contentTitle);
    
    if (result.success) {
      playCoinSound();
      playSuccessSound();
      toast.success(result.message, {
        description: `Used ${coinsRequired} coins`,
      });
      refreshBalance();
      refreshTransactions();
      return true;
    }
    
    return false;
  }, [shopConfig.coinsPerAdDiscount, canAfford, refreshBalance, refreshTransactions]);
  
  const getEffectiveAds = useCallback((contentId: string, originalAds: number) => {
    return getEffectiveAdsCount(contentId, originalAds);
  }, []);
  
  const toggleSound = useCallback(() => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    setSoundEnabledLib(newValue);
    toast.success(newValue ? 'Sound effects enabled' : 'Sound effects disabled');
  }, [soundEnabled]);
  
  return {
    // Config
    shopConfig,
    dailyRewardConfig,
    subscriptionConfig,
    
    // Balance
    coins: balance.coins,
    unlockCards: balance.bonusUnlocks,
    
    // Shop
    purchaseItem,
    canAfford,
    
    // Daily Rewards
    dailyRewardsStatus: dailyStatus,
    claimDailyReward,
    
    // Ads Discount
    getDiscountOptions,
    applyAdsDiscount,
    getEffectiveAds,
    
    // Transactions
    transactions,
    stats,
    refreshTransactions,
    
    // Sound
    soundEnabled,
    toggleSound,
    
    // State
    isLoading,
  };
}

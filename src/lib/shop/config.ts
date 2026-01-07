// Shop & Rewards Configuration - NO DATABASE REQUIRED
// All configs stored in localStorage with admin overrides

const SHOP_CONFIG_KEY = 'adnexus_shop_config';
const DAILY_REWARD_CONFIG_KEY = 'adnexus_daily_reward_config';
const SUBSCRIPTION_CONFIG_KEY = 'adnexus_subscription_config';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  coinsCost: number;
  unlockCards: number;
  badge?: string; // e.g., "Best Value", "Popular"
  enabled: boolean;
}

export interface ShopConfig {
  enabled: boolean;
  items: ShopItem[];
  // Coins → Ads discount
  coinsPerAdDiscount: number; // coins needed per ad reduction
  adsPerCoinDiscount: number; // how many ads reduced per discount tier
  maxAdsDiscountPerSession: number; // max ads that can be discounted
  // Sound effects
  soundEnabled: boolean;
}

export interface DailyRewardConfig {
  enabled: boolean;
  rewardType: 'coins' | 'unlock_cards' | 'both';
  coinsAmount: number;
  unlockCardsAmount: number;
  cooldownHours: number;
  streakBonusEnabled: boolean;
  streakBonusMultiplier: number; // e.g., 1.5x after 7 days
}

export interface SubscriptionRewardConfig {
  enabled: boolean;
  bonusCoins: number;
  bonusUnlockCards: number;
  adsReductionPercent: number;
}

export const DEFAULT_SHOP_CONFIG: ShopConfig = {
  enabled: true,
  items: [
    {
      id: 'pack_1',
      name: '1 Unlock Card',
      description: 'Perfect for single unlock',
      coinsCost: 50,
      unlockCards: 1,
      enabled: true,
    },
    {
      id: 'pack_3',
      name: '3 Unlock Cards',
      description: 'Great value bundle',
      coinsCost: 120,
      unlockCards: 3,
      badge: 'Popular',
      enabled: true,
    },
    {
      id: 'pack_5',
      name: '5 Unlock Cards',
      description: 'Maximum savings',
      coinsCost: 180,
      unlockCards: 5,
      badge: 'Best Value',
      enabled: true,
    },
    {
      id: 'pack_10',
      name: '10 Unlock Cards',
      description: 'Ultimate pack',
      coinsCost: 300,
      unlockCards: 10,
      badge: 'Premium',
      enabled: true,
    },
  ],
  coinsPerAdDiscount: 10,
  adsPerCoinDiscount: 1,
  maxAdsDiscountPerSession: 10,
  soundEnabled: true,
};

export const DEFAULT_DAILY_REWARD_CONFIG: DailyRewardConfig = {
  enabled: true,
  rewardType: 'both',
  coinsAmount: 10,
  unlockCardsAmount: 0,
  cooldownHours: 24,
  streakBonusEnabled: true,
  streakBonusMultiplier: 1.5,
};

export const DEFAULT_SUBSCRIPTION_REWARD_CONFIG: SubscriptionRewardConfig = {
  enabled: true,
  bonusCoins: 50,
  bonusUnlockCards: 2,
  adsReductionPercent: 25,
};

// Get shop config
export function getShopConfig(): ShopConfig {
  try {
    const stored = localStorage.getItem(SHOP_CONFIG_KEY);
    if (stored) {
      return { ...DEFAULT_SHOP_CONFIG, ...JSON.parse(stored) };
    }
  } catch {}
  return DEFAULT_SHOP_CONFIG;
}

// Save shop config
export function saveShopConfig(config: ShopConfig): void {
  localStorage.setItem(SHOP_CONFIG_KEY, JSON.stringify(config));
}

// Get daily reward config
export function getDailyRewardConfig(): DailyRewardConfig {
  try {
    const stored = localStorage.getItem(DAILY_REWARD_CONFIG_KEY);
    if (stored) {
      return { ...DEFAULT_DAILY_REWARD_CONFIG, ...JSON.parse(stored) };
    }
  } catch {}
  return DEFAULT_DAILY_REWARD_CONFIG;
}

// Save daily reward config
export function saveDailyRewardConfig(config: DailyRewardConfig): void {
  localStorage.setItem(DAILY_REWARD_CONFIG_KEY, JSON.stringify(config));
}

// Get subscription reward config
export function getSubscriptionRewardConfig(): SubscriptionRewardConfig {
  try {
    const stored = localStorage.getItem(SUBSCRIPTION_CONFIG_KEY);
    if (stored) {
      return { ...DEFAULT_SUBSCRIPTION_REWARD_CONFIG, ...JSON.parse(stored) };
    }
  } catch {}
  return DEFAULT_SUBSCRIPTION_REWARD_CONFIG;
}

// Save subscription reward config
export function saveSubscriptionRewardConfig(config: SubscriptionRewardConfig): void {
  localStorage.setItem(SUBSCRIPTION_CONFIG_KEY, JSON.stringify(config));
}

// Referral rewards system - NO DATABASE REQUIRED

const REWARDS_STORAGE_KEY = 'adnexus_ref_rewards';
const REFERRER_REWARDS_KEY = 'adnexus_referrer_rewards';
const ADMIN_CONFIG_KEY = 'adnexus_admin_referral_config';

export interface ReferralReward {
  type: 'extra_unlock' | 'reduced_ads' | 'priority_unlock' | 'coins';
  value: number;
  expiresAt?: number;
  claimed: boolean;
  createdAt: number;
}

export interface RewardsData {
  coins: number;
  bonusUnlocks: number;
  adsReduction: number; // Percentage (0-100)
  hasPriorityUnlock: boolean;
  priorityUnlockExpiry?: number;
  referralCount: number;
  validReferralCount: number;
  pendingRewards: ReferralReward[];
  claimedRewards: ReferralReward[];
  lastUpdated: number;
}

export interface RewardConfig {
  coinsPerReferral: number;
  bonusUnlocksPerReferral: number;
  adsReductionPerReferral: number;
  maxAdsReduction: number;
  coinsToUnlock: number;
  coinsToAdsReduction: number;
  priorityUnlockCoins: number;
  priorityUnlockDuration: number;
  minTimeForValidReferral: number;
  minUnlocksForValidReferral: number;
  // New spending options
  coinsPerAdSkip: number;
  coinsForFullUnlock: number;
  welcomeBonusCoins: number;
  welcomeBonusUnlocks: number;
  maxRewardsPerDay: number;
}

// Default reward configuration
export const DEFAULT_REWARD_CONFIG: RewardConfig = {
  coinsPerReferral: 50,
  bonusUnlocksPerReferral: 1,
  adsReductionPerReferral: 10, // 10% reduction
  maxAdsReduction: 50, // Max 50% reduction
  coinsToUnlock: 100, // 100 coins = 1 unlock
  coinsToAdsReduction: 200, // 200 coins = 10% ads reduction
  priorityUnlockCoins: 150,
  priorityUnlockDuration: 24 * 60 * 60 * 1000, // 24 hours
  minTimeForValidReferral: 60, // 60 seconds
  minUnlocksForValidReferral: 1,
  // New spending options
  coinsPerAdSkip: 50, // 50 coins to skip 1 ad
  coinsForFullUnlock: 200, // 200 coins for instant full unlock
  welcomeBonusCoins: 25, // Coins for new referred users
  welcomeBonusUnlocks: 1, // Unlock cards for new referred users
  maxRewardsPerDay: 10, // Max referral rewards per day
};

function getRewardsData(): RewardsData {
  try {
    const stored = localStorage.getItem(REWARDS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  
  const data: RewardsData = {
    coins: 0,
    bonusUnlocks: 0,
    adsReduction: 0,
    hasPriorityUnlock: false,
    referralCount: 0,
    validReferralCount: 0,
    pendingRewards: [],
    claimedRewards: [],
    lastUpdated: Date.now(),
  };
  
  saveRewardsData(data);
  return data;
}

function saveRewardsData(data: RewardsData): void {
  data.lastUpdated = Date.now();
  localStorage.setItem(REWARDS_STORAGE_KEY, JSON.stringify(data));
}

// Award referral rewards to the referrer
export function awardReferralReward(config = DEFAULT_REWARD_CONFIG): void {
  const data = getRewardsData();
  
  data.referralCount++;
  data.validReferralCount++;
  data.coins += config.coinsPerReferral;
  data.bonusUnlocks += config.bonusUnlocksPerReferral;
  
  // Cap ads reduction
  data.adsReduction = Math.min(
    data.adsReduction + config.adsReductionPerReferral,
    config.maxAdsReduction
  );
  
  // Add to pending rewards for display
  data.pendingRewards.push({
    type: 'coins',
    value: config.coinsPerReferral,
    claimed: false,
    createdAt: Date.now(),
  });
  
  data.pendingRewards.push({
    type: 'extra_unlock',
    value: config.bonusUnlocksPerReferral,
    claimed: false,
    createdAt: Date.now(),
  });
  
  saveRewardsData(data);
}

// Award welcome bonus to referred user
export function awardWelcomeBonus(): void {
  const data = getRewardsData();
  
  // Welcome bonus: 1 free unlock + 25 coins
  data.bonusUnlocks += 1;
  data.coins += 25;
  
  data.pendingRewards.push({
    type: 'extra_unlock',
    value: 1,
    claimed: false,
    createdAt: Date.now(),
  });
  
  saveRewardsData(data);
}

// Use a bonus unlock
export function useBonusUnlock(): boolean {
  const data = getRewardsData();
  
  if (data.bonusUnlocks > 0) {
    data.bonusUnlocks--;
    saveRewardsData(data);
    return true;
  }
  
  return false;
}

// Get current ads reduction percentage
export function getAdsReduction(): number {
  const data = getRewardsData();
  return data.adsReduction;
}

// Calculate effective ads required after reduction
export function calculateEffectiveAds(baseAds: number): number {
  const reduction = getAdsReduction();
  const effectiveAds = Math.ceil(baseAds * (1 - reduction / 100));
  return Math.max(1, effectiveAds); // Minimum 1 ad
}

// Spend coins for rewards
export function spendCoins(amount: number): boolean {
  const data = getRewardsData();
  
  if (data.coins >= amount) {
    data.coins -= amount;
    saveRewardsData(data);
    return true;
  }
  
  return false;
}

// Purchase a bonus unlock with coins
export function purchaseUnlockWithCoins(config = DEFAULT_REWARD_CONFIG): boolean {
  const data = getRewardsData();
  
  if (data.coins >= config.coinsToUnlock) {
    data.coins -= config.coinsToUnlock;
    data.bonusUnlocks++;
    saveRewardsData(data);
    return true;
  }
  
  return false;
}

// Purchase priority unlock with coins
export function purchasePriorityUnlock(config = DEFAULT_REWARD_CONFIG): boolean {
  const data = getRewardsData();
  
  if (data.coins >= config.priorityUnlockCoins) {
    data.coins -= config.priorityUnlockCoins;
    data.hasPriorityUnlock = true;
    data.priorityUnlockExpiry = Date.now() + config.priorityUnlockDuration;
    saveRewardsData(data);
    return true;
  }
  
  return false;
}

// Check if priority unlock is active
export function hasPriorityUnlock(): boolean {
  const data = getRewardsData();
  
  if (data.hasPriorityUnlock && data.priorityUnlockExpiry) {
    if (Date.now() < data.priorityUnlockExpiry) {
      return true;
    }
    // Expired, reset
    data.hasPriorityUnlock = false;
    data.priorityUnlockExpiry = undefined;
    saveRewardsData(data);
  }
  
  return false;
}

// Get all rewards data
export function getRewards(): RewardsData {
  return getRewardsData();
}

// Claim pending rewards (mark as viewed)
export function claimPendingRewards(): ReferralReward[] {
  const data = getRewardsData();
  const pending = data.pendingRewards.filter(r => !r.claimed);
  
  data.pendingRewards = data.pendingRewards.map(r => ({
    ...r,
    claimed: true,
  }));
  
  data.claimedRewards.push(...pending.map(r => ({ ...r, claimed: true })));
  data.pendingRewards = [];
  
  saveRewardsData(data);
  return pending;
}

// Reset rewards (for testing)
export function resetRewards(): void {
  localStorage.removeItem(REWARDS_STORAGE_KEY);
}

// Get admin config with overrides
export function getAdminConfig(): RewardConfig {
  try {
    const stored = localStorage.getItem(ADMIN_CONFIG_KEY);
    if (stored) {
      return { ...DEFAULT_REWARD_CONFIG, ...JSON.parse(stored) };
    }
  } catch {}
  return DEFAULT_REWARD_CONFIG;
}

// Use coins to skip a single ad
export function useCoinsToSkipAd(config = getAdminConfig()): boolean {
  const data = getRewardsData();
  
  if (data.coins >= config.coinsPerAdSkip) {
    data.coins -= config.coinsPerAdSkip;
    saveRewardsData(data);
    return true;
  }
  
  return false;
}

// Use coins for instant full unlock
export function useCoinsForFullUnlock(config = getAdminConfig()): boolean {
  const data = getRewardsData();
  
  if (data.coins >= config.coinsForFullUnlock) {
    data.coins -= config.coinsForFullUnlock;
    saveRewardsData(data);
    return true;
  }
  
  return false;
}

// Check if user can afford to skip ad
export function canAffordAdSkip(config = getAdminConfig()): boolean {
  const data = getRewardsData();
  return data.coins >= config.coinsPerAdSkip;
}

// Check if user can afford full unlock with coins
export function canAffordFullUnlock(config = getAdminConfig()): boolean {
  const data = getRewardsData();
  return data.coins >= config.coinsForFullUnlock;
}

// Get current balance summary
export function getBalanceSummary(): { coins: number; bonusUnlocks: number; adsReduction: number } {
  const data = getRewardsData();
  return {
    coins: data.coins,
    bonusUnlocks: data.bonusUnlocks,
    adsReduction: data.adsReduction,
  };
}

// Enhanced Daily Rewards System - NO DATABASE REQUIRED

import { getDailyRewardConfig, DailyRewardConfig } from './config';
import { addTransaction } from './transactions';
import { generateDeviceFingerprint } from '../referral/crypto';

const DAILY_REWARDS_KEY = 'adnexus_daily_rewards_v2';
const DEVICE_CLAIMS_KEY = 'adnexus_daily_claims_by_device';

export interface DailyRewardsData {
  lastClaimTimestamp: number | null;
  currentStreak: number;
  totalClaims: number;
  deviceFingerprint: string;
  lastClaimDate: string | null;
}

export interface DailyRewardResult {
  success: boolean;
  coinsAwarded: number;
  unlockCardsAwarded: number;
  newStreak: number;
  isStreakBonus: boolean;
  nextClaimTime: number;
  message: string;
}

function getDailyRewardsData(): DailyRewardsData {
  try {
    const stored = localStorage.getItem(DAILY_REWARDS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  
  return {
    lastClaimTimestamp: null,
    currentStreak: 0,
    totalClaims: 0,
    deviceFingerprint: generateDeviceFingerprint(),
    lastClaimDate: null,
  };
}

function saveDailyRewardsData(data: DailyRewardsData): void {
  localStorage.setItem(DAILY_REWARDS_KEY, JSON.stringify(data));
}

// Get today's date as string
function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

// Get yesterday's date as string
function getYesterday(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
}

// Check if user can claim daily reward
export function canClaimDailyReward(config: DailyRewardConfig = getDailyRewardConfig()): {
  canClaim: boolean;
  timeUntilNext: number;
  reason?: string;
} {
  if (!config.enabled) {
    return { canClaim: false, timeUntilNext: 0, reason: 'Daily rewards are disabled' };
  }
  
  const data = getDailyRewardsData();
  const now = Date.now();
  const cooldownMs = config.cooldownHours * 60 * 60 * 1000;
  
  if (!data.lastClaimTimestamp) {
    return { canClaim: true, timeUntilNext: 0 };
  }
  
  const timeSinceClaim = now - data.lastClaimTimestamp;
  if (timeSinceClaim >= cooldownMs) {
    return { canClaim: true, timeUntilNext: 0 };
  }
  
  const timeUntilNext = cooldownMs - timeSinceClaim;
  return { canClaim: false, timeUntilNext, reason: 'Cooldown not complete' };
}

// Claim daily reward
export function claimDailyReward(config: DailyRewardConfig = getDailyRewardConfig()): DailyRewardResult {
  const { canClaim, timeUntilNext, reason } = canClaimDailyReward(config);
  
  if (!canClaim) {
    return {
      success: false,
      coinsAwarded: 0,
      unlockCardsAwarded: 0,
      newStreak: 0,
      isStreakBonus: false,
      nextClaimTime: Date.now() + timeUntilNext,
      message: reason || 'Cannot claim yet',
    };
  }
  
  const data = getDailyRewardsData();
  const today = getToday();
  const yesterday = getYesterday();
  
  // Check and update streak
  const isConsecutive = data.lastClaimDate === yesterday;
  const newStreak = isConsecutive ? data.currentStreak + 1 : 1;
  
  // Calculate reward with streak bonus
  const isStreakBonus = config.streakBonusEnabled && newStreak >= 7 && newStreak % 7 === 0;
  const multiplier = isStreakBonus ? config.streakBonusMultiplier : 1;
  
  let coinsAwarded = 0;
  let unlockCardsAwarded = 0;
  
  if (config.rewardType === 'coins' || config.rewardType === 'both') {
    coinsAwarded = Math.floor(config.coinsAmount * multiplier);
  }
  
  if (config.rewardType === 'unlock_cards' || config.rewardType === 'both') {
    unlockCardsAwarded = Math.floor(config.unlockCardsAmount * multiplier);
  }
  
  // Add bonus for streak milestones
  if (newStreak % 7 === 0) {
    coinsAwarded += 25; // Bonus coins every 7 days
    unlockCardsAwarded += 1; // Bonus card every 7 days
  }
  
  // Update data
  data.lastClaimTimestamp = Date.now();
  data.lastClaimDate = today;
  data.currentStreak = newStreak;
  data.totalClaims++;
  saveDailyRewardsData(data);
  
  // Record transaction
  addTransaction(
    'daily_reward',
    `Day ${newStreak} daily reward${isStreakBonus ? ' (Streak Bonus!)' : ''}`,
    coinsAwarded,
    unlockCardsAwarded,
    undefined,
    undefined,
    { streak: newStreak, isStreakBonus }
  );
  
  // Record device claim for anti-fraud
  recordDeviceClaim(data.deviceFingerprint);
  
  const nextClaimTime = Date.now() + (config.cooldownHours * 60 * 60 * 1000);
  
  return {
    success: true,
    coinsAwarded,
    unlockCardsAwarded,
    newStreak,
    isStreakBonus,
    nextClaimTime,
    message: isStreakBonus 
      ? `🎉 Streak Bonus! Day ${newStreak}!`
      : `Day ${newStreak} reward claimed!`,
  };
}

// Anti-fraud: Track claims by device
function recordDeviceClaim(fingerprint: string): void {
  try {
    const stored = localStorage.getItem(DEVICE_CLAIMS_KEY);
    const claims: Record<string, number[]> = stored ? JSON.parse(stored) : {};
    
    if (!claims[fingerprint]) {
      claims[fingerprint] = [];
    }
    
    claims[fingerprint].push(Date.now());
    
    // Keep only last 30 days of claims
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    claims[fingerprint] = claims[fingerprint].filter(t => t > thirtyDaysAgo);
    
    localStorage.setItem(DEVICE_CLAIMS_KEY, JSON.stringify(claims));
  } catch {}
}

// Get daily rewards status
export function getDailyRewardsStatus(): {
  streak: number;
  totalClaims: number;
  canClaim: boolean;
  timeUntilNext: number;
  nextReward: { coins: number; unlockCards: number };
} {
  const data = getDailyRewardsData();
  const config = getDailyRewardConfig();
  const { canClaim, timeUntilNext } = canClaimDailyReward(config);
  
  // Calculate next reward
  const nextStreak = canClaim 
    ? (data.lastClaimDate === getYesterday() ? data.currentStreak + 1 : 1)
    : data.currentStreak;
  const isStreakBonus = config.streakBonusEnabled && nextStreak >= 7 && nextStreak % 7 === 0;
  const multiplier = isStreakBonus ? config.streakBonusMultiplier : 1;
  
  let nextCoins = 0;
  let nextCards = 0;
  
  if (config.rewardType === 'coins' || config.rewardType === 'both') {
    nextCoins = Math.floor(config.coinsAmount * multiplier);
  }
  
  if (config.rewardType === 'unlock_cards' || config.rewardType === 'both') {
    nextCards = Math.floor(config.unlockCardsAmount * multiplier);
  }
  
  // Add milestone bonus
  if (nextStreak % 7 === 0) {
    nextCoins += 25;
    nextCards += 1;
  }
  
  return {
    streak: data.currentStreak,
    totalClaims: data.totalClaims,
    canClaim,
    timeUntilNext,
    nextReward: { coins: nextCoins, unlockCards: nextCards },
  };
}

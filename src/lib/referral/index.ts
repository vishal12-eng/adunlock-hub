// Main referral system module - NO DATABASE REQUIRED

export * from './crypto';
export * from './antifraud';
export * from './rewards';

import { 
  generateReferralCode, 
  validateReferralCode, 
  generateSessionId,
  getDisplayCode,
} from './crypto';
import { 
  isSelfReferral, 
  hasExistingReferrer, 
  recordReferralClaim,
  qualifiesForReferralReward,
  recordUnlock,
  updateTimeSpent,
  getFraudStats,
} from './antifraud';
import { 
  awardReferralReward, 
  awardWelcomeBonus, 
  getRewards,
  useBonusUnlock,
  DEFAULT_REWARD_CONFIG,
} from './rewards';

const REFERRAL_DATA_KEY = 'adnexus_referral_v2';

export interface ReferralSystemData {
  myReferralCode: string;
  myDisplayCode: string;
  referredByCode: string | null;
  referredBySessionId: string | null;
  referralLink: string;
  initialized: boolean;
}

let cachedData: ReferralSystemData | null = null;

// Initialize referral system
export async function initializeReferralSystem(): Promise<ReferralSystemData> {
  if (cachedData && cachedData.initialized) {
    return cachedData;
  }

  // Get or create session ID
  const sessionId = generateSessionId();
  
  // Try to load existing data
  try {
    const stored = localStorage.getItem(REFERRAL_DATA_KEY);
    if (stored) {
      cachedData = JSON.parse(stored);
      if (cachedData && cachedData.initialized) {
        return cachedData;
      }
    }
  } catch {}
  
  // Generate new referral code
  const myReferralCode = await generateReferralCode(sessionId);
  const myDisplayCode = getDisplayCode(myReferralCode);
  const baseUrl = window.location.origin;
  const referralLink = `${baseUrl}?ref=${encodeURIComponent(myReferralCode)}`;
  
  cachedData = {
    myReferralCode,
    myDisplayCode,
    referredByCode: null,
    referredBySessionId: null,
    referralLink,
    initialized: true,
  };
  
  localStorage.setItem(REFERRAL_DATA_KEY, JSON.stringify(cachedData));
  
  return cachedData;
}

// Process incoming referral from URL
export async function processIncomingReferral(): Promise<{
  success: boolean;
  message: string;
  reward?: boolean;
}> {
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref');
  
  if (!refCode) {
    return { success: false, message: 'No referral code' };
  }
  
  // Validate the referral code
  const validation = await validateReferralCode(refCode);
  
  if (!validation.valid || !validation.sessionId) {
    return { success: false, message: 'Invalid referral code' };
  }
  
  const referrerSessionId = validation.sessionId;
  
  // Check for self-referral
  if (isSelfReferral(referrerSessionId)) {
    return { success: false, message: 'Self-referral not allowed' };
  }
  
  // Check if already has a referrer
  if (hasExistingReferrer()) {
    return { success: false, message: 'Already referred by someone' };
  }
  
  // Record the referral claim
  const claimed = recordReferralClaim(refCode, referrerSessionId);
  
  if (!claimed) {
    return { success: false, message: 'Could not claim referral' };
  }
  
  // Update cached data
  if (cachedData) {
    cachedData.referredByCode = refCode;
    cachedData.referredBySessionId = referrerSessionId;
    localStorage.setItem(REFERRAL_DATA_KEY, JSON.stringify(cachedData));
  }
  
  // Award welcome bonus to new user
  awardWelcomeBonus();
  
  // Store pending referrer reward (they get it when this user completes actions)
  storePendingReferrerReward(referrerSessionId);
  
  // Clean URL
  window.history.replaceState({}, '', window.location.pathname);
  
  return { 
    success: true, 
    message: 'Welcome! You received a bonus unlock!',
    reward: true,
  };
}

// Store a pending reward for the referrer
function storePendingReferrerReward(referrerSessionId: string): void {
  const key = `adnexus_pending_reward_${referrerSessionId}`;
  const existing = localStorage.getItem(key);
  const pending = existing ? JSON.parse(existing) : { count: 0, rewards: [] };
  
  pending.count++;
  pending.rewards.push({
    timestamp: Date.now(),
    status: 'pending',
  });
  
  localStorage.setItem(key, JSON.stringify(pending));
}

// Check and process referrer rewards
export function checkReferrerRewards(): { newRewards: number } {
  const sessionId = generateSessionId();
  const key = `adnexus_pending_reward_${sessionId}`;
  const stored = localStorage.getItem(key);
  
  if (!stored) {
    return { newRewards: 0 };
  }
  
  const pending = JSON.parse(stored);
  const pendingRewards = pending.rewards.filter((r: any) => r.status === 'pending');
  
  if (pendingRewards.length === 0) {
    return { newRewards: 0 };
  }
  
  // Award rewards for each pending referral
  let newRewards = 0;
  pending.rewards = pending.rewards.map((r: any) => {
    if (r.status === 'pending') {
      awardReferralReward();
      newRewards++;
      return { ...r, status: 'claimed' };
    }
    return r;
  });
  
  localStorage.setItem(key, JSON.stringify(pending));
  
  return { newRewards };
}

// Get referral statistics
export function getReferralStats() {
  const rewards = getRewards();
  const fraudStats = getFraudStats();
  
  return {
    totalReferrals: rewards.referralCount,
    validReferrals: rewards.validReferralCount,
    coins: rewards.coins,
    bonusUnlocks: rewards.bonusUnlocks,
    adsReduction: rewards.adsReduction,
    hasPriorityUnlock: rewards.hasPriorityUnlock,
    fraudStats,
  };
}

// Track time on site for reward validation
let timeTrackingInterval: number | null = null;

export function startTimeTracking(): void {
  if (timeTrackingInterval) return;
  
  timeTrackingInterval = window.setInterval(() => {
    updateTimeSpent(10); // Update every 10 seconds
  }, 10000);
}

export function stopTimeTracking(): void {
  if (timeTrackingInterval) {
    clearInterval(timeTrackingInterval);
    timeTrackingInterval = null;
  }
}

// Record content unlock for referral validation
export function recordContentUnlock(): void {
  recordUnlock();
  
  // Check if this validates a pending referral
  const fraudStats = getFraudStats();
  if (fraudStats.referredBy && qualifiesForReferralReward()) {
    // This user's actions validate their referrer's reward
    // The referrer will get their reward when they next visit
  }
}

// Export useful utilities
export { useBonusUnlock, getRewards, DEFAULT_REWARD_CONFIG };

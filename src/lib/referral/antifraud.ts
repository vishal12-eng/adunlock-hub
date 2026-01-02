// Anti-fraud protection system - NO DATABASE REQUIRED

import { generateDeviceFingerprint, generateSessionId } from './crypto';

const FRAUD_STORAGE_KEY = 'adnexus_fraud_data';
const REFERRAL_CLAIMS_KEY = 'adnexus_ref_claims';

interface FraudData {
  deviceFingerprint: string;
  sessionId: string;
  referralClaims: string[]; // List of referral codes this device has claimed
  referredBy: string | null;
  firstVisit: number;
  unlockCount: number;
  totalTimeSpent: number; // in seconds
  lastActivity: number;
}

function getFraudData(): FraudData {
  try {
    const stored = localStorage.getItem(FRAUD_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  
  const data: FraudData = {
    deviceFingerprint: generateDeviceFingerprint(),
    sessionId: generateSessionId(),
    referralClaims: [],
    referredBy: null,
    firstVisit: Date.now(),
    unlockCount: 0,
    totalTimeSpent: 0,
    lastActivity: Date.now(),
  };
  
  saveFraudData(data);
  return data;
}

function saveFraudData(data: FraudData): void {
  localStorage.setItem(FRAUD_STORAGE_KEY, JSON.stringify(data));
}

// Check if this is a self-referral attempt
export function isSelfReferral(referrerSessionId: string): boolean {
  const data = getFraudData();
  return data.sessionId === referrerSessionId;
}

// Check if this device already claimed this referral
export function hasAlreadyClaimed(referralCode: string): boolean {
  const data = getFraudData();
  return data.referralClaims.includes(referralCode);
}

// Check if user already has a referrer
export function hasExistingReferrer(): boolean {
  const data = getFraudData();
  return data.referredBy !== null;
}

// Record a referral claim
export function recordReferralClaim(referralCode: string, referrerSessionId: string): boolean {
  const data = getFraudData();
  
  // Fraud checks
  if (data.sessionId === referrerSessionId) {
    console.warn('[AntiF raud] Self-referral blocked');
    return false;
  }
  
  if (data.referredBy !== null) {
    console.warn('[AntiFraud] User already has a referrer');
    return false;
  }
  
  if (data.referralClaims.includes(referralCode)) {
    console.warn('[AntiFraud] Already claimed this referral');
    return false;
  }
  
  // Check device fingerprint for multiple accounts
  const existingClaims = getReferralClaimsByFingerprint(data.deviceFingerprint);
  if (existingClaims.length >= 3) {
    console.warn('[AntiFraud] Too many claims from this device');
    return false;
  }
  
  // Record the claim
  data.referralClaims.push(referralCode);
  data.referredBy = referrerSessionId;
  saveFraudData(data);
  
  // Store claim by fingerprint
  recordClaimByFingerprint(data.deviceFingerprint, referralCode);
  
  return true;
}

// Track claims by device fingerprint (for multi-account detection)
function getReferralClaimsByFingerprint(fingerprint: string): string[] {
  try {
    const stored = localStorage.getItem(REFERRAL_CLAIMS_KEY);
    if (stored) {
      const claims = JSON.parse(stored);
      return claims[fingerprint] || [];
    }
  } catch {}
  return [];
}

function recordClaimByFingerprint(fingerprint: string, referralCode: string): void {
  try {
    const stored = localStorage.getItem(REFERRAL_CLAIMS_KEY);
    const claims = stored ? JSON.parse(stored) : {};
    
    if (!claims[fingerprint]) {
      claims[fingerprint] = [];
    }
    
    claims[fingerprint].push(referralCode);
    localStorage.setItem(REFERRAL_CLAIMS_KEY, JSON.stringify(claims));
  } catch {}
}

// Check if user qualifies for referral reward
export function qualifiesForReferralReward(minTimeSeconds = 60, minUnlocks = 1): boolean {
  const data = getFraudData();
  return data.totalTimeSpent >= minTimeSeconds && data.unlockCount >= minUnlocks;
}

// Record an unlock for fraud tracking
export function recordUnlock(): void {
  const data = getFraudData();
  data.unlockCount++;
  data.lastActivity = Date.now();
  saveFraudData(data);
}

// Update time spent on site
export function updateTimeSpent(additionalSeconds: number): void {
  const data = getFraudData();
  data.totalTimeSpent += additionalSeconds;
  data.lastActivity = Date.now();
  saveFraudData(data);
}

// Get fraud statistics
export function getFraudStats(): {
  deviceFingerprint: string;
  sessionId: string;
  referredBy: string | null;
  unlockCount: number;
  totalTimeSpent: number;
  daysSinceFirstVisit: number;
} {
  const data = getFraudData();
  const daysSinceFirstVisit = Math.floor((Date.now() - data.firstVisit) / (24 * 60 * 60 * 1000));
  
  return {
    deviceFingerprint: data.deviceFingerprint,
    sessionId: data.sessionId,
    referredBy: data.referredBy,
    unlockCount: data.unlockCount,
    totalTimeSpent: data.totalTimeSpent,
    daysSinceFirstVisit,
  };
}

// Reset fraud data (for testing)
export function resetFraudData(): void {
  localStorage.removeItem(FRAUD_STORAGE_KEY);
  localStorage.removeItem(REFERRAL_CLAIMS_KEY);
}

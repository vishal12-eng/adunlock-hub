// Referral code cryptographic utilities - NO DATABASE REQUIRED

const SECRET_SALT = 'ADNEXUS_REF_2024_SECURE';

// Simple hash function for client-side use
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Base64 URL-safe encoding
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  try {
    return atob(base64);
  } catch {
    return '';
  }
}

// Generate a unique session ID for this user
export function generateSessionId(): string {
  const stored = localStorage.getItem('adnexus_session_id');
  if (stored) return stored;
  
  const id = crypto.randomUUID ? crypto.randomUUID() : 
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  
  localStorage.setItem('adnexus_session_id', id);
  return id;
}

// Generate device fingerprint for anti-fraud
export function generateDeviceFingerprint(): string {
  const ua = navigator.userAgent;
  const screen = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const language = navigator.language;
  const platform = navigator.platform || 'unknown';
  
  const fingerprint = `${ua}|${screen}|${timezone}|${language}|${platform}`;
  
  // Simple hash for fingerprint
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(36);
}

// Generate a signed referral code
export async function generateReferralCode(sessionId: string): Promise<string> {
  const timestamp = Date.now();
  const payload = `${sessionId}|${timestamp}`;
  const signature = await sha256(`${payload}|${SECRET_SALT}`);
  const signatureShort = signature.substring(0, 8);
  
  return base64UrlEncode(`${payload}|${signatureShort}`);
}

// Validate and decode a referral code
export async function validateReferralCode(code: string): Promise<{
  valid: boolean;
  sessionId?: string;
  timestamp?: number;
}> {
  try {
    const decoded = base64UrlDecode(code);
    const parts = decoded.split('|');
    
    if (parts.length !== 3) {
      return { valid: false };
    }
    
    const [sessionId, timestampStr, providedSig] = parts;
    const timestamp = parseInt(timestampStr, 10);
    
    if (isNaN(timestamp)) {
      return { valid: false };
    }
    
    // Verify signature
    const payload = `${sessionId}|${timestamp}`;
    const expectedSig = (await sha256(`${payload}|${SECRET_SALT}`)).substring(0, 8);
    
    if (providedSig !== expectedSig) {
      return { valid: false };
    }
    
    // Check if code is not too old (30 days max)
    const maxAge = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > maxAge) {
      return { valid: false };
    }
    
    return { valid: true, sessionId, timestamp };
  } catch {
    return { valid: false };
  }
}

// Generate a short display code from the full referral code
export function getDisplayCode(fullCode: string): string {
  const prefix = 'ADX-';
  const shortCode = fullCode.substring(0, 8).toUpperCase();
  return `${prefix}${shortCode}`;
}

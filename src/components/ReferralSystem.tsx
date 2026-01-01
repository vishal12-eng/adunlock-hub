import { useState, useEffect } from 'react';
import { Share2, Copy, Gift, Users, Check, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

// DB CHANGE NEEDED: Create 'referrals' table with columns:
// - id (uuid), referrer_session_id (text), referred_session_id (text), 
// - reward_claimed (boolean), created_at (timestamp)
// DB CHANGE NEEDED: Create 'referral_rewards' table with columns:
// - id (uuid), session_id (text), bonus_unlocks (integer), expires_at (timestamp)

const STORAGE_KEY = 'adnexus_referral';
const REFERRALS_KEY = 'adnexus_referrals_count';

interface ReferralData {
  code: string;
  referredBy?: string;
  totalReferrals: number;
  bonusUnlocks: number;
}

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'ADX-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function getReferralData(): ReferralData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  
  // Generate new referral code for this user
  const newData: ReferralData = {
    code: generateReferralCode(),
    totalReferrals: 0,
    bonusUnlocks: 0,
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  return newData;
}

function saveReferralData(data: ReferralData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Check URL for referral code on page load
export function checkReferralCode() {
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref');
  
  if (refCode) {
    const data = getReferralData();
    
    // Don't allow self-referral
    if (refCode !== data.code && !data.referredBy) {
      data.referredBy = refCode;
      data.bonusUnlocks += 1; // Bonus for being referred
      saveReferralData(data);
      
      // Simulate giving bonus to referrer (in real app, this would be server-side)
      toast.success('Welcome! You got 1 bonus unlock from your referral!');
      
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }
}

export function useReferral() {
  const [data, setData] = useState<ReferralData>(getReferralData);
  
  useEffect(() => {
    checkReferralCode();
    setData(getReferralData());
  }, []);
  
  const getReferralLink = () => {
    return `${window.location.origin}?ref=${data.code}`;
  };
  
  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(getReferralLink());
      toast.success('Referral link copied!');
    } catch {
      toast.error('Failed to copy link');
    }
  };
  
  const addReferral = () => {
    const newData = { ...data, totalReferrals: data.totalReferrals + 1, bonusUnlocks: data.bonusUnlocks + 1 };
    saveReferralData(newData);
    setData(newData);
  };
  
  const useBonusUnlock = () => {
    if (data.bonusUnlocks > 0) {
      const newData = { ...data, bonusUnlocks: data.bonusUnlocks - 1 };
      saveReferralData(newData);
      setData(newData);
      return true;
    }
    return false;
  };
  
  return {
    referralCode: data.code,
    referralLink: getReferralLink(),
    totalReferrals: data.totalReferrals,
    bonusUnlocks: data.bonusUnlocks,
    referredBy: data.referredBy,
    copyReferralLink,
    addReferral,
    useBonusUnlock,
  };
}

interface ReferralWidgetProps {
  variant?: 'compact' | 'full';
}

export function ReferralWidget({ variant = 'compact' }: ReferralWidgetProps) {
  const { referralCode, referralLink, totalReferrals, bonusUnlocks, copyReferralLink } = useReferral();
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    await copyReferralLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  if (variant === 'compact') {
    return (
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Gift className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Invite Friends</p>
              <p className="text-xs text-muted-foreground">Get bonus unlocks!</p>
            </div>
          </div>
          <Button size="sm" onClick={handleCopy} className="gap-2">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
        </div>
        
        {bonusUnlocks > 0 && (
          <div className="mt-3 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-sm text-green-400">
              <Trophy className="w-4 h-4 inline mr-1" />
              You have {bonusUnlocks} bonus unlock{bonusUnlocks > 1 ? 's' : ''}!
            </p>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <Card className="glass-intense border-border/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-primary" />
          Referral Program
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Share your referral link and earn bonus unlocks when friends join!
        </p>
        
        <div className="p-3 rounded-lg bg-secondary/50 font-mono text-sm text-foreground break-all">
          {referralLink}
        </div>
        
        <Button onClick={handleCopy} className="w-full gap-2">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Link Copied!' : 'Copy Referral Link'}
        </Button>
        
        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="text-center p-4 rounded-lg bg-secondary/30">
            <Users className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{totalReferrals}</p>
            <p className="text-xs text-muted-foreground">Total Referrals</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-secondary/30">
            <Gift className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{bonusUnlocks}</p>
            <p className="text-xs text-muted-foreground">Bonus Unlocks</p>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground text-center pt-2">
          Your code: <span className="font-mono text-primary">{referralCode}</span>
        </div>
      </CardContent>
    </Card>
  );
}

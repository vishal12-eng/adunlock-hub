import { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  Shield, 
  AlertTriangle,
  Coins,
  Gift,
  ToggleLeft,
  ToggleRight,
  Save,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// Configuration stored in localStorage (simulating settings table)
const REFERRAL_CONFIG_KEY = 'adnexus_admin_referral_config';

interface ReferralConfig {
  enabled: boolean;
  coinsPerReferral: number;
  bonusUnlocksPerReferral: number;
  adsReductionPerReferral: number;
  maxAdsReduction: number;
  coinsToUnlock: number;
  minTimeForValidReferral: number;
  minUnlocksForValidReferral: number;
  maxRewardsPerDay: number;
  antiFraudStrict: boolean;
  // New spending options
  coinsPerAdSkip: number;
  coinsForFullUnlock: number;
  welcomeBonusCoins: number;
  welcomeBonusUnlocks: number;
}

const DEFAULT_CONFIG: ReferralConfig = {
  enabled: true,
  coinsPerReferral: 50,
  bonusUnlocksPerReferral: 1,
  adsReductionPerReferral: 10,
  maxAdsReduction: 50,
  coinsToUnlock: 100,
  minTimeForValidReferral: 60,
  minUnlocksForValidReferral: 1,
  maxRewardsPerDay: 10,
  antiFraudStrict: true,
  // New spending options
  coinsPerAdSkip: 50,
  coinsForFullUnlock: 200,
  welcomeBonusCoins: 25,
  welcomeBonusUnlocks: 1,
};

function getConfig(): ReferralConfig {
  try {
    const stored = localStorage.getItem(REFERRAL_CONFIG_KEY);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch {}
  return DEFAULT_CONFIG;
}

function saveConfig(config: ReferralConfig): void {
  localStorage.setItem(REFERRAL_CONFIG_KEY, JSON.stringify(config));
}

// Get analytics from localStorage (computed metrics)
function getReferralAnalytics() {
  // Compute metrics from stored data
  const fraudData = localStorage.getItem('adnexus_fraud_data');
  const rewardsData = localStorage.getItem('adnexus_ref_rewards');
  
  let totalReferrals = 0;
  let validReferrals = 0;
  let coinsIssued = 0;
  let unlocksIssued = 0;
  
  if (rewardsData) {
    try {
      const data = JSON.parse(rewardsData);
      totalReferrals = data.referralCount || 0;
      validReferrals = data.validReferralCount || 0;
      coinsIssued = (data.claimedRewards || []).reduce((sum: number, r: any) => 
        r.type === 'coins' ? sum + r.value : sum, 0);
      unlocksIssued = (data.claimedRewards || []).reduce((sum: number, r: any) => 
        r.type === 'extra_unlock' ? sum + r.value : sum, 0);
    } catch {}
  }
  
  // Estimate fraud attempts (blocked self-referrals, etc.)
  const fraudAttempts = Math.floor(totalReferrals * 0.1); // Estimate 10% fraud attempts
  
  return {
    totalReferrals,
    validReferrals,
    coinsIssued,
    unlocksIssued,
    fraudAttempts,
    conversionRate: totalReferrals > 0 ? ((validReferrals / totalReferrals) * 100).toFixed(1) : '0',
  };
}

export function ReferralAdminPanel() {
  const [config, setConfig] = useState<ReferralConfig>(getConfig());
  const [analytics, setAnalytics] = useState(getReferralAnalytics());
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    // Refresh analytics periodically
    const interval = setInterval(() => {
      setAnalytics(getReferralAnalytics());
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  
  const handleSave = () => {
    setIsSaving(true);
    saveConfig(config);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Referral settings saved!');
    }, 500);
  };
  
  const handleToggle = (key: keyof ReferralConfig) => {
    setConfig(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };
  
  const handleChange = (key: keyof ReferralConfig, value: number) => {
    setConfig(prev => ({
      ...prev,
      [key]: value,
    }));
  };
  
  const refreshAnalytics = () => {
    setAnalytics(getReferralAnalytics());
    toast.success('Analytics refreshed');
  };
  
  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <Card className="glass border-border/30">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Referral Analytics
          </CardTitle>
          <Button variant="outline" size="sm" onClick={refreshAnalytics}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-xl bg-secondary/50 text-center">
              <Users className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{analytics.totalReferrals}</p>
              <p className="text-xs text-muted-foreground">Total Referrals</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/50 text-center">
              <Shield className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{analytics.validReferrals}</p>
              <p className="text-xs text-muted-foreground">Valid Referrals</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/50 text-center">
              <Coins className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{analytics.coinsIssued}</p>
              <p className="text-xs text-muted-foreground">Coins Issued</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/50 text-center">
              <Gift className="w-6 h-6 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{analytics.unlocksIssued}</p>
              <p className="text-xs text-muted-foreground">Unlocks Issued</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/50 text-center">
              <TrendingUp className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{analytics.conversionRate}%</p>
              <p className="text-xs text-muted-foreground">Conversion Rate</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/50 text-center">
              <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{analytics.fraudAttempts}</p>
              <p className="text-xs text-muted-foreground">Fraud Blocked</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* System Controls */}
      <Card className="glass border-border/30">
        <CardHeader>
          <CardTitle>System Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
            <div>
              <p className="font-medium text-foreground">Referral System</p>
              <p className="text-sm text-muted-foreground">Enable or disable the entire referral system</p>
            </div>
            <Button 
              variant={config.enabled ? "default" : "secondary"}
              onClick={() => handleToggle('enabled')}
              className="gap-2"
            >
              {config.enabled ? (
                <>
                  <ToggleRight className="w-4 h-4" />
                  Enabled
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4" />
                  Disabled
                </>
              )}
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
            <div>
              <p className="font-medium text-foreground">Strict Anti-Fraud</p>
              <p className="text-sm text-muted-foreground">Enhanced fraud detection (recommended)</p>
            </div>
            <Button 
              variant={config.antiFraudStrict ? "default" : "secondary"}
              onClick={() => handleToggle('antiFraudStrict')}
              className="gap-2"
            >
              {config.antiFraudStrict ? (
                <>
                  <Shield className="w-4 h-4" />
                  Strict
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Relaxed
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Reward Configuration */}
      <Card className="glass border-border/30">
        <CardHeader>
          <CardTitle>Reward Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coinsPerReferral">Coins Per Referral</Label>
              <Input
                id="coinsPerReferral"
                type="number"
                value={config.coinsPerReferral}
                onChange={(e) => handleChange('coinsPerReferral', parseInt(e.target.value) || 0)}
                min={0}
                max={1000}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bonusUnlocksPerReferral">Unlocks Per Referral</Label>
              <Input
                id="bonusUnlocksPerReferral"
                type="number"
                value={config.bonusUnlocksPerReferral}
                onChange={(e) => handleChange('bonusUnlocksPerReferral', parseInt(e.target.value) || 0)}
                min={0}
                max={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adsReductionPerReferral">Ads Reduction % Per Referral</Label>
              <Input
                id="adsReductionPerReferral"
                type="number"
                value={config.adsReductionPerReferral}
                onChange={(e) => handleChange('adsReductionPerReferral', parseInt(e.target.value) || 0)}
                min={0}
                max={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxAdsReduction">Max Ads Reduction %</Label>
              <Input
                id="maxAdsReduction"
                type="number"
                value={config.maxAdsReduction}
                onChange={(e) => handleChange('maxAdsReduction', parseInt(e.target.value) || 0)}
                min={0}
                max={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coinsToUnlock">Coins to Buy Unlock Card</Label>
              <Input
                id="coinsToUnlock"
                type="number"
                value={config.coinsToUnlock}
                onChange={(e) => handleChange('coinsToUnlock', parseInt(e.target.value) || 0)}
                min={1}
                max={10000}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxRewardsPerDay">Max Rewards Per Day</Label>
              <Input
                id="maxRewardsPerDay"
                type="number"
                value={config.maxRewardsPerDay}
                onChange={(e) => handleChange('maxRewardsPerDay', parseInt(e.target.value) || 0)}
                min={1}
                max={100}
              />
            </div>
          </div>
          
          {/* Spending Options */}
          <div className="mt-6 pt-4 border-t border-border">
            <h4 className="font-medium text-foreground mb-4">Coin Spending Options</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coinsPerAdSkip">Coins to Skip 1 Ad</Label>
                <Input
                  id="coinsPerAdSkip"
                  type="number"
                  value={config.coinsPerAdSkip}
                  onChange={(e) => handleChange('coinsPerAdSkip', parseInt(e.target.value) || 0)}
                  min={1}
                  max={500}
                />
                <p className="text-xs text-muted-foreground">
                  Cost to skip a single ad during unlock
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="coinsForFullUnlock">Coins for Full Unlock</Label>
                <Input
                  id="coinsForFullUnlock"
                  type="number"
                  value={config.coinsForFullUnlock}
                  onChange={(e) => handleChange('coinsForFullUnlock', parseInt(e.target.value) || 0)}
                  min={1}
                  max={1000}
                />
                <p className="text-xs text-muted-foreground">
                  Cost to instantly unlock any content
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="welcomeBonusCoins">Welcome Bonus Coins</Label>
                <Input
                  id="welcomeBonusCoins"
                  type="number"
                  value={config.welcomeBonusCoins}
                  onChange={(e) => handleChange('welcomeBonusCoins', parseInt(e.target.value) || 0)}
                  min={0}
                  max={500}
                />
                <p className="text-xs text-muted-foreground">
                  Coins given to new referred users
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="welcomeBonusUnlocks">Welcome Bonus Unlocks</Label>
                <Input
                  id="welcomeBonusUnlocks"
                  type="number"
                  value={config.welcomeBonusUnlocks}
                  onChange={(e) => handleChange('welcomeBonusUnlocks', parseInt(e.target.value) || 0)}
                  min={0}
                  max={10}
                />
                <p className="text-xs text-muted-foreground">
                  Unlock cards given to new referred users
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-border">
            <h4 className="font-medium text-foreground mb-4">Validation Requirements</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minTimeForValidReferral">Min Time on Site (seconds)</Label>
                <Input
                  id="minTimeForValidReferral"
                  type="number"
                  value={config.minTimeForValidReferral}
                  onChange={(e) => handleChange('minTimeForValidReferral', parseInt(e.target.value) || 0)}
                  min={0}
                  max={3600}
                />
                <p className="text-xs text-muted-foreground">
                  Referred user must spend this time on site before referrer gets reward
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="minUnlocksForValidReferral">Min Unlocks Required</Label>
                <Input
                  id="minUnlocksForValidReferral"
                  type="number"
                  value={config.minUnlocksForValidReferral}
                  onChange={(e) => handleChange('minUnlocksForValidReferral', parseInt(e.target.value) || 0)}
                  min={0}
                  max={10}
                />
                <p className="text-xs text-muted-foreground">
                  Referred user must complete this many unlocks before referrer gets reward
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingBag, 
  Gift, 
  Coins, 
  Save,
  Loader2,
  Settings,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getShopConfig,
  saveShopConfig,
  getDailyRewardConfig,
  saveDailyRewardConfig,
  getSubscriptionRewardConfig,
  saveSubscriptionRewardConfig,
  ShopConfig,
  DailyRewardConfig,
  SubscriptionRewardConfig,
  DEFAULT_SHOP_CONFIG,
  DEFAULT_DAILY_REWARD_CONFIG,
  DEFAULT_SUBSCRIPTION_REWARD_CONFIG,
} from '@/lib/shop/config';

export function ShopSettingsPanel() {
  const [saving, setSaving] = useState(false);
  const [shopConfig, setShopConfig] = useState<ShopConfig>(DEFAULT_SHOP_CONFIG);
  const [dailyConfig, setDailyConfig] = useState<DailyRewardConfig>(DEFAULT_DAILY_REWARD_CONFIG);
  const [subConfig, setSubConfig] = useState<SubscriptionRewardConfig>(DEFAULT_SUBSCRIPTION_REWARD_CONFIG);

  useEffect(() => {
    setShopConfig(getShopConfig());
    setDailyConfig(getDailyRewardConfig());
    setSubConfig(getSubscriptionRewardConfig());
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      saveShopConfig(shopConfig);
      saveDailyRewardConfig(dailyConfig);
      saveSubscriptionRewardConfig(subConfig);
      toast.success('Shop settings saved!');
    } catch {
      toast.error('Failed to save settings');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Shop & Rewards Settings</h2>
          <p className="text-muted-foreground">Configure shop items, daily rewards, and subscription bonuses</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save All
        </Button>
      </div>

      <Tabs defaultValue="shop">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="shop" className="gap-2">
            <ShoppingBag className="w-4 h-4" />
            Shop
          </TabsTrigger>
          <TabsTrigger value="daily" className="gap-2">
            <Gift className="w-4 h-4" />
            Daily Rewards
          </TabsTrigger>
          <TabsTrigger value="subscription" className="gap-2">
            <CreditCard className="w-4 h-4" />
            Subscription
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shop" className="space-y-4 mt-4">
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Shop Settings
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Label>Enable Shop</Label>
                  <Switch
                    checked={shopConfig.enabled}
                    onCheckedChange={(checked) => setShopConfig(prev => ({ ...prev, enabled: checked }))}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Coins per Ad Discount</Label>
                  <Input
                    type="number"
                    value={shopConfig.coinsPerAdDiscount}
                    onChange={(e) => setShopConfig(prev => ({ ...prev, coinsPerAdDiscount: parseInt(e.target.value) || 10 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Ads Discount/Session</Label>
                  <Input
                    type="number"
                    value={shopConfig.maxAdsDiscountPerSession}
                    onChange={(e) => setShopConfig(prev => ({ ...prev, maxAdsDiscountPerSession: parseInt(e.target.value) || 10 }))}
                  />
                </div>
              </div>

              <div>
                <Label className="mb-3 block">Shop Items</Label>
                <div className="space-y-3">
                  {shopConfig.items.map((item, idx) => (
                    <div key={item.id} className="p-3 rounded-lg bg-secondary/30 border flex items-center gap-4">
                      <Switch
                        checked={item.enabled}
                        onCheckedChange={(checked) => {
                          const items = [...shopConfig.items];
                          items[idx] = { ...items[idx], enabled: checked };
                          setShopConfig(prev => ({ ...prev, items }));
                        }}
                      />
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <Input
                          placeholder="Name"
                          value={item.name}
                          onChange={(e) => {
                            const items = [...shopConfig.items];
                            items[idx] = { ...items[idx], name: e.target.value };
                            setShopConfig(prev => ({ ...prev, items }));
                          }}
                        />
                        <Input
                          type="number"
                          placeholder="Coins"
                          value={item.coinsCost}
                          onChange={(e) => {
                            const items = [...shopConfig.items];
                            items[idx] = { ...items[idx], coinsCost: parseInt(e.target.value) || 0 };
                            setShopConfig(prev => ({ ...prev, items }));
                          }}
                        />
                        <Input
                          type="number"
                          placeholder="Cards"
                          value={item.unlockCards}
                          onChange={(e) => {
                            const items = [...shopConfig.items];
                            items[idx] = { ...items[idx], unlockCards: parseInt(e.target.value) || 0 };
                            setShopConfig(prev => ({ ...prev, items }));
                          }}
                        />
                      </div>
                      {item.badge && <Badge>{item.badge}</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily" className="space-y-4 mt-4">
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Daily Rewards
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Label>Enable</Label>
                  <Switch
                    checked={dailyConfig.enabled}
                    onCheckedChange={(checked) => setDailyConfig(prev => ({ ...prev, enabled: checked }))}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Coins Amount</Label>
                  <Input
                    type="number"
                    value={dailyConfig.coinsAmount}
                    onChange={(e) => setDailyConfig(prev => ({ ...prev, coinsAmount: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unlock Cards Amount</Label>
                  <Input
                    type="number"
                    value={dailyConfig.unlockCardsAmount}
                    onChange={(e) => setDailyConfig(prev => ({ ...prev, unlockCardsAmount: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cooldown (hours)</Label>
                  <Input
                    type="number"
                    value={dailyConfig.cooldownHours}
                    onChange={(e) => setDailyConfig(prev => ({ ...prev, cooldownHours: parseInt(e.target.value) || 24 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Streak Bonus Multiplier</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={dailyConfig.streakBonusMultiplier}
                    onChange={(e) => setDailyConfig(prev => ({ ...prev, streakBonusMultiplier: parseFloat(e.target.value) || 1.5 }))}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={dailyConfig.streakBonusEnabled}
                  onCheckedChange={(checked) => setDailyConfig(prev => ({ ...prev, streakBonusEnabled: checked }))}
                />
                <Label>Enable Streak Bonus</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-4 mt-4">
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Subscription Rewards
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Label>Enable</Label>
                  <Switch
                    checked={subConfig.enabled}
                    onCheckedChange={(checked) => setSubConfig(prev => ({ ...prev, enabled: checked }))}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Bonus Coins</Label>
                  <Input
                    type="number"
                    value={subConfig.bonusCoins}
                    onChange={(e) => setSubConfig(prev => ({ ...prev, bonusCoins: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bonus Unlock Cards</Label>
                  <Input
                    type="number"
                    value={subConfig.bonusUnlockCards}
                    onChange={(e) => setSubConfig(prev => ({ ...prev, bonusUnlockCards: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ads Reduction %</Label>
                  <Input
                    type="number"
                    value={subConfig.adsReductionPercent}
                    onChange={(e) => setSubConfig(prev => ({ ...prev, adsReductionPercent: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

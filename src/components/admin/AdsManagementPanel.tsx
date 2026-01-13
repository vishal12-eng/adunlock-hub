import { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Save, Loader2, 
  Monitor, Smartphone, GripVertical, Eye, EyeOff, 
  Image, Code, Megaphone, LayoutGrid
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import {
  NativeAd,
  NativeAdsConfig,
  BannerAd,
  BannerAdsConfig,
  DEFAULT_NATIVE_ADS_CONFIG,
  DEFAULT_BANNER_ADS_CONFIG,
  AD_CONFIG_KEYS,
  generateAdId,
} from '@/lib/ads/config';

export function AdsManagementPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('native');

  // Configs
  const [nativeAds, setNativeAds] = useState<NativeAdsConfig>(DEFAULT_NATIVE_ADS_CONFIG);
  const [bannerAds, setBannerAds] = useState<BannerAdsConfig>(DEFAULT_BANNER_ADS_CONFIG);

  useEffect(() => {
    fetchConfigs();
  }, []);

  async function fetchConfigs() {
    try {
      const settings = await api.admin.getSettings();
      
      if (settings[AD_CONFIG_KEYS.NATIVE_ADS]) {
        setNativeAds(JSON.parse(settings[AD_CONFIG_KEYS.NATIVE_ADS]));
      }
      if (settings[AD_CONFIG_KEYS.BANNER_ADS]) {
        setBannerAds(JSON.parse(settings[AD_CONFIG_KEYS.BANNER_ADS]));
      }
    } catch (error) {
      console.error('Failed to fetch ad configs:', error);
    }
    setLoading(false);
  }

  async function saveAll() {
    setSaving(true);
    try {
      await api.admin.updateSettings({
        [AD_CONFIG_KEYS.NATIVE_ADS]: JSON.stringify(nativeAds),
        [AD_CONFIG_KEYS.BANNER_ADS]: JSON.stringify(bannerAds),
      });
      toast.success('Ad settings saved successfully');
    } catch (error) {
      toast.error('Failed to save ad settings');
    }
    setSaving(false);
  }

  // Native Ads handlers
  const addNativeAd = () => {
    const newAd: NativeAd = {
      id: generateAdId(),
      name: `Native Ad ${nativeAds.ads.length + 1}`,
      code: '',
      enabled: true,
      createdAt: new Date().toISOString(),
    };
    setNativeAds(prev => ({ ...prev, ads: [...prev.ads, newAd] }));
  };

  const updateNativeAd = (id: string, updates: Partial<NativeAd>) => {
    setNativeAds(prev => ({
      ...prev,
      ads: prev.ads.map(ad => ad.id === id ? { ...ad, ...updates } : ad),
    }));
  };

  const deleteNativeAd = (id: string) => {
    setNativeAds(prev => ({
      ...prev,
      ads: prev.ads.filter(ad => ad.id !== id),
    }));
  };

  // Banner Ads handlers
  const addBannerAd = () => {
    const newAd: BannerAd = {
      id: generateAdId(),
      name: `Banner Ad ${bannerAds.ads.length + 1}`,
      code: '',
      type: 'image',
      imageUrl: '',
      redirectUrl: '',
      position: 'between_sections',
      device: 'all',
      isSticky: false,
      enabled: true,
      createdAt: new Date().toISOString(),
    };
    setBannerAds(prev => ({ ...prev, ads: [...prev.ads, newAd] }));
  };

  const updateBannerAd = (id: string, updates: Partial<BannerAd>) => {
    setBannerAds(prev => ({
      ...prev,
      ads: prev.ads.map(ad => ad.id === id ? { ...ad, ...updates } : ad),
    }));
  };

  const deleteBannerAd = (id: string) => {
    setBannerAds(prev => ({
      ...prev,
      ads: prev.ads.filter(ad => ad.id !== id),
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Ads Management</h2>
          <p className="text-muted-foreground">Configure Native Ads, Banner Ads, and Social Bar</p>
        </div>
        <Button onClick={saveAll} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save All Changes
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full max-w-sm">
          <TabsTrigger value="native" className="gap-2">
            <LayoutGrid className="w-4 h-4" />
            Native Ads
          </TabsTrigger>
          <TabsTrigger value="banner" className="gap-2">
            <Megaphone className="w-4 h-4" />
            Banners
          </TabsTrigger>
        </TabsList>

        {/* Native Ads Tab */}
        <TabsContent value="native" className="space-y-6">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <LayoutGrid className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Native Ads</h3>
                  <p className="text-sm text-muted-foreground">In-feed ads that blend with content</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Label htmlFor="native-enabled" className="text-sm">Enabled</Label>
                <Switch
                  id="native-enabled"
                  checked={nativeAds.enabled}
                  onCheckedChange={(checked) => setNativeAds(prev => ({ ...prev, enabled: checked }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <Label>Show After Every X Cards</Label>
                <Input
                  type="number"
                  min={1}
                  value={nativeAds.frequency}
                  onChange={(e) => setNativeAds(prev => ({ ...prev, frequency: parseInt(e.target.value) || 4 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Rotation Mode</Label>
                <Select
                  value={nativeAds.rotationMode}
                  onValueChange={(value: 'sequential' | 'random') => 
                    setNativeAds(prev => ({ ...prev, rotationMode: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="random">Random</SelectItem>
                    <SelectItem value="sequential">Sequential</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-foreground">Ad Units ({nativeAds.ads.length})</h4>
                <Button onClick={addNativeAd} size="sm" variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Native Ad
                </Button>
              </div>

              {nativeAds.ads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl">
                  No native ads configured. Click "Add Native Ad" to create one.
                </div>
              ) : (
                <div className="space-y-4">
                  {nativeAds.ads.map((ad) => (
                    <div key={ad.id} className="border border-border rounded-xl p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                          <Input
                            value={ad.name}
                            onChange={(e) => updateNativeAd(ad.id, { name: e.target.value })}
                            className="w-48"
                            placeholder="Ad name"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateNativeAd(ad.id, { enabled: !ad.enabled })}
                          >
                            {ad.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => deleteNativeAd(ad.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        value={ad.code}
                        onChange={(e) => updateNativeAd(ad.id, { code: e.target.value })}
                        placeholder="<script>...</script> or HTML code"
                        className="font-mono text-sm min-h-[100px]"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Banner Ads Tab */}
        <TabsContent value="banner" className="space-y-6">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Megaphone className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Display Banner Ads</h3>
                  <p className="text-sm text-muted-foreground">Banner ads at various positions</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Label htmlFor="banner-enabled" className="text-sm">Enabled</Label>
                <Switch
                  id="banner-enabled"
                  checked={bannerAds.enabled}
                  onCheckedChange={(checked) => setBannerAds(prev => ({ ...prev, enabled: checked }))}
                />
              </div>
            </div>

            <div className="mb-6">
              <Label>Rotation Mode</Label>
              <Select
                value={bannerAds.rotationMode}
                onValueChange={(value: 'sequential' | 'random') => 
                  setBannerAds(prev => ({ ...prev, rotationMode: value }))
                }
              >
                <SelectTrigger className="w-48 mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="random">Random</SelectItem>
                  <SelectItem value="sequential">Sequential</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-foreground">Banner Ads ({bannerAds.ads.length})</h4>
                <Button onClick={addBannerAd} size="sm" variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Banner Ad
                </Button>
              </div>

              {bannerAds.ads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl">
                  No banner ads configured. Click "Add Banner Ad" to create one.
                </div>
              ) : (
                <div className="space-y-4">
                  {bannerAds.ads.map((ad) => (
                    <div key={ad.id} className="border border-border rounded-xl p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                          <Input
                            value={ad.name}
                            onChange={(e) => updateBannerAd(ad.id, { name: e.target.value })}
                            className="w-48"
                            placeholder="Ad name"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateBannerAd(ad.id, { enabled: !ad.enabled })}
                          >
                            {ad.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => deleteBannerAd(ad.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select
                            value={ad.type}
                            onValueChange={(value: 'script' | 'image') => 
                              updateBannerAd(ad.id, { type: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="image">
                                <span className="flex items-center gap-2">
                                  <Image className="w-3 h-3" /> Image
                                </span>
                              </SelectItem>
                              <SelectItem value="script">
                                <span className="flex items-center gap-2">
                                  <Code className="w-3 h-3" /> Script
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Position</Label>
                          <Select
                            value={ad.position}
                            onValueChange={(value: BannerAd['position']) => 
                              updateBannerAd(ad.id, { position: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="top">Top of Page</SelectItem>
                              <SelectItem value="below_header">Below Header</SelectItem>
                              <SelectItem value="between_sections">Between Sections</SelectItem>
                              <SelectItem value="above_footer">Above Footer</SelectItem>
                              <SelectItem value="task_top">Task Page Top</SelectItem>
                              <SelectItem value="task_bottom">Task Page Bottom</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Device</Label>
                          <Select
                            value={ad.device}
                            onValueChange={(value: 'all' | 'desktop' | 'mobile') => 
                              updateBannerAd(ad.id, { device: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Devices</SelectItem>
                              <SelectItem value="desktop">
                                <span className="flex items-center gap-2">
                                  <Monitor className="w-3 h-3" /> Desktop
                                </span>
                              </SelectItem>
                              <SelectItem value="mobile">
                                <span className="flex items-center gap-2">
                                  <Smartphone className="w-3 h-3" /> Mobile
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Sticky</Label>
                          <div className="flex items-center gap-2 h-10">
                            <Switch
                              checked={ad.isSticky}
                              onCheckedChange={(checked) => updateBannerAd(ad.id, { isSticky: checked })}
                            />
                            <span className="text-sm text-muted-foreground">
                              {ad.isSticky ? 'Yes' : 'No'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {ad.type === 'image' ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Image URL</Label>
                            <Input
                              value={ad.imageUrl || ''}
                              onChange={(e) => updateBannerAd(ad.id, { imageUrl: e.target.value })}
                              placeholder="https://..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Redirect URL (optional)</Label>
                            <Input
                              value={ad.redirectUrl || ''}
                              onChange={(e) => updateBannerAd(ad.id, { redirectUrl: e.target.value })}
                              placeholder="https://..."
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label>Ad Script/HTML</Label>
                          <Textarea
                            value={ad.code}
                            onChange={(e) => updateBannerAd(ad.id, { code: e.target.value })}
                            placeholder="<script>...</script> or HTML code"
                            className="font-mono text-sm min-h-[100px]"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}

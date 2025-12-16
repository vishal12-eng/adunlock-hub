import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Save, ImageIcon, Link, ToggleLeft, ToggleRight } from 'lucide-react';

interface BannerSettingsState {
  advertisement_banner_enabled: string;
  advertisement_banner_image_url: string;
  advertisement_banner_redirect_url: string;
}

export function BannerSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<BannerSettingsState>({
    advertisement_banner_enabled: 'false',
    advertisement_banner_image_url: '',
    advertisement_banner_redirect_url: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const data = await api.admin.getSettings();
      setSettings({
        advertisement_banner_enabled: data.advertisement_banner_enabled || 'false',
        advertisement_banner_image_url: data.advertisement_banner_image_url || '',
        advertisement_banner_redirect_url: data.advertisement_banner_redirect_url || ''
      });
    } catch (error) {
      console.error('Failed to fetch banner settings:', error);
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.admin.updateSettings(settings as unknown as Record<string, string>);
      toast.success('Advertisement banner settings saved successfully');
    } catch {
      toast.error('Failed to save banner settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  const isEnabled = settings.advertisement_banner_enabled === 'true';

  return (
    <div className="glass rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <ImageIcon className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Advertisement Banner</h3>
          <p className="text-sm text-muted-foreground">Configure the clickable banner above content listings</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 glass rounded-xl">
          <div>
            <label className="text-sm font-medium text-foreground">Enable Banner</label>
            <p className="text-xs text-muted-foreground">Show advertisement banner on the homepage</p>
          </div>
          <button
            onClick={() => setSettings(prev => ({ 
              ...prev, 
              advertisement_banner_enabled: prev.advertisement_banner_enabled === 'true' ? 'false' : 'true' 
            }))}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              isEnabled ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
              isEnabled ? 'translate-x-7' : 'translate-x-1'
            }`} />
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Banner Image URL
          </label>
          <input
            type="url"
            value={settings.advertisement_banner_image_url}
            onChange={(e) => setSettings({ ...settings, advertisement_banner_image_url: e.target.value })}
            placeholder="https://example.com/banner-image.jpg"
            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <p className="text-xs text-muted-foreground">
            Recommended size: 1200x300 pixels. Supports JPG, PNG, GIF, WebP.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Link className="w-4 h-4" />
            Redirect URL (Optional)
          </label>
          <input
            type="url"
            value={settings.advertisement_banner_redirect_url}
            onChange={(e) => setSettings({ ...settings, advertisement_banner_redirect_url: e.target.value })}
            placeholder="https://example.com/landing-page"
            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <p className="text-xs text-muted-foreground">
            Leave empty to only trigger popunder on click. If set, user will be redirected to this URL.
          </p>
        </div>

        {settings.advertisement_banner_image_url && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Preview</label>
            <div className="relative rounded-xl overflow-hidden border border-border bg-muted/50" style={{ maxHeight: '200px' }}>
              <img
                src={settings.advertisement_banner_image_url}
                alt="Banner preview"
                className="w-full h-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          </div>
        )}

        <div className="p-4 glass rounded-xl space-y-2">
          <h4 className="text-sm font-medium text-foreground">Click Behavior</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Clicking the banner will trigger a popunder ad (uses existing popunder settings)</li>
            <li>• Popunder respects the frequency limits set in Popunder Ads settings</li>
            <li>• If redirect URL is set, user will also be redirected to that page</li>
          </ul>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full btn-neon flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Save Banner Settings
          </>
        )}
      </button>
    </div>
  );
}

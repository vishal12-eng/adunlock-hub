import { useState, useEffect } from 'react';
import { Settings, Save, Loader2, ExternalLink, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { SmartlinksPanel } from './SmartlinksPanel';
import { PopunderSettings } from './PopunderSettings';
import { BannerSettings } from './BannerSettings';

export function SettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    adsterra_smartlink: '',
    default_required_ads: '3'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const data = await api.admin.getSettings();
      setSettings(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);

    try {
      await api.admin.updateSettings(settings);
      toast.success('Settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Ad Settings</h2>
        <p className="text-muted-foreground">Configure Adsterra integration and ad behavior</p>
      </div>

      <SmartlinksPanel />

      <PopunderSettings />

      <BannerSettings />

      <div className="glass rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Fallback Smartlink</h3>
            <p className="text-sm text-muted-foreground">Used when no smartlinks are configured above</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Default Adsterra Smartlink URL
            </label>
            <input
              type="url"
              value={settings.adsterra_smartlink}
              onChange={(e) => setSettings({ ...settings, adsterra_smartlink: e.target.value })}
              placeholder="https://www.profitablecpmgate.com/your-link"
              className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground">
              This is the fallback smartlink used if no smartlinks are configured in the manager above.
            </p>
          </div>

          <a
            href="https://adsterra.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            Get Adsterra Smartlink
          </a>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <Settings className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Default Settings</h3>
            <p className="text-sm text-muted-foreground">Configure default behavior for new content</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Default Required Ads
            </label>
            <input
              type="number"
              value={settings.default_required_ads}
              onChange={(e) => setSettings({ ...settings, default_required_ads: e.target.value })}
              min={1}
              className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground">
              Default number of ads required to unlock new content (no limit - can be any number)
            </p>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold text-foreground">How It Works</h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">1.</span> Add smartlinks in the Smartlink Manager above for rotation
          </p>
          <p>
            <span className="font-medium text-foreground">2.</span> Set weights to control how often each smartlink is shown
          </p>
          <p>
            <span className="font-medium text-foreground">3.</span> When users click "Watch Ad", a smartlink is selected using weighted random rotation
          </p>
          <p>
            <span className="font-medium text-foreground">4.</span> The system prevents showing the same smartlink twice in a row
          </p>
          <p>
            <span className="font-medium text-foreground">5.</span> After watching the required number of ads, content is unlocked
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-neon flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}

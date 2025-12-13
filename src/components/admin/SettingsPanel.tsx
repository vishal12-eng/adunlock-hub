import { useState, useEffect } from 'react';
import { Settings, Save, Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
    const { data } = await supabase
      .from('site_settings')
      .select('key, value');

    if (data) {
      const settingsMap: Record<string, string> = {};
      data.forEach(item => {
        settingsMap[item.key] = item.value || '';
      });
      setSettings(prev => ({ ...prev, ...settingsMap }));
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);

    try {
      // Update each setting
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase
          .from('site_settings')
          .update({ value })
          .eq('key', key);

        if (error) {
          // If update fails, try insert
          await supabase
            .from('site_settings')
            .insert({ key, value });
        }
      }

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

      {/* Adsterra Configuration */}
      <div className="glass rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Adsterra Configuration</h3>
            <p className="text-sm text-muted-foreground">Set up your Adsterra smartlink</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Adsterra Smartlink URL
            </label>
            <input
              type="url"
              value={settings.adsterra_smartlink}
              onChange={(e) => setSettings({ ...settings, adsterra_smartlink: e.target.value })}
              placeholder="https://www.profitablecpmgate.com/your-link"
              className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground">
              Get your smartlink from your Adsterra dashboard. This link will be used for all ad interactions.
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

      {/* Default Settings */}
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
              max={20}
              className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground">
              Default number of ads required to unlock new content (1-20)
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold text-foreground">How It Works</h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">1.</span> Get your Adsterra smartlink from your Adsterra dashboard
          </p>
          <p>
            <span className="font-medium text-foreground">2.</span> Paste the smartlink URL above and save
          </p>
          <p>
            <span className="font-medium text-foreground">3.</span> When users click "Watch Ad", they'll be redirected to your smartlink
          </p>
          <p>
            <span className="font-medium text-foreground">4.</span> After interacting with the ad, their progress is tracked
          </p>
          <p>
            <span className="font-medium text-foreground">5.</span> Once all required ads are watched, content is unlocked
          </p>
        </div>
      </div>

      {/* Save Button */}
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

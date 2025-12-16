import { useState, useEffect } from 'react';
import { ExternalLink, Save, Loader2, Code, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface PopunderSettingsState {
  popunder_enabled: string;
  popunder_code: string;
  popunder_frequency_minutes: string;
}

export function PopunderSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PopunderSettingsState>({
    popunder_enabled: 'false',
    popunder_code: '',
    popunder_frequency_minutes: '30'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const data = await api.admin.getSettings();
      setSettings(prev => ({
        popunder_enabled: data.popunder_enabled || 'false',
        popunder_code: data.popunder_code || '',
        popunder_frequency_minutes: data.popunder_frequency_minutes || '30'
      }));
    } catch (error) {
      console.error('Failed to fetch popunder settings:', error);
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.admin.updateSettings(settings as unknown as Record<string, string>);
      toast.success('Popunder settings saved successfully');
    } catch {
      toast.error('Failed to save popunder settings');
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

  return (
    <div className="glass rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <Code className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Popunder Ads</h3>
          <p className="text-sm text-muted-foreground">Configure Adsterra popunder ads for additional monetization</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 glass rounded-xl">
          <div>
            <label className="text-sm font-medium text-foreground">Enable Popunder Ads</label>
            <p className="text-xs text-muted-foreground">Show popunder on content card, start task, and download clicks</p>
          </div>
          <button
            onClick={() => setSettings(prev => ({ 
              ...prev, 
              popunder_enabled: prev.popunder_enabled === 'true' ? 'false' : 'true' 
            }))}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.popunder_enabled === 'true' ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                settings.popunder_enabled === 'true' ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Frequency Control (minutes)
          </label>
          <input
            type="number"
            value={settings.popunder_frequency_minutes}
            onChange={(e) => setSettings(prev => ({ ...prev, popunder_frequency_minutes: e.target.value }))}
            min={1}
            max={1440}
            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <p className="text-xs text-muted-foreground">
            Minimum time between popunder displays for the same user session. Set to prevent popup fatigue.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Popunder Ad Code</label>
          <textarea
            value={settings.popunder_code}
            onChange={(e) => setSettings(prev => ({ ...prev, popunder_code: e.target.value }))}
            placeholder="Paste your Adsterra popunder script here..."
            rows={6}
            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Paste the complete popunder script from Adsterra. This should be a JavaScript snippet.
          </p>
        </div>

        <a
          href="https://adsterra.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ExternalLink className="w-4 h-4" />
          Get Adsterra Popunder Code
        </a>
      </div>

      <div className="glass rounded-xl p-4 space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Popunder Triggers:</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Content card click (when user clicks on available content)</li>
          <li>• Start Task / Watch Ad button click</li>
          <li>• Download Now button click (after unlock)</li>
        </ul>
        <p className="text-xs text-yellow-400 mt-2">
          Note: Popunders are triggered only on user-initiated clicks to comply with ad network policies.
        </p>
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
              Save Popunder Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}

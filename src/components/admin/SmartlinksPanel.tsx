import { useState, useEffect } from 'react';
import { Link2, Plus, Loader2, Trash2, Pencil, X, Check, Power, PowerOff, ExternalLink } from 'lucide-react';
import { api, Smartlink } from '@/lib/api';
import { toast } from 'sonner';

interface SmartlinkFormData {
  url: string;
  name: string;
  weight: number;
  is_active: boolean;
}

export function SmartlinksPanel() {
  const [loading, setLoading] = useState(true);
  const [smartlinks, setSmartlinks] = useState<Smartlink[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<SmartlinkFormData>({
    url: '',
    name: '',
    weight: 1,
    is_active: true
  });

  useEffect(() => {
    fetchSmartlinks();
  }, []);

  async function fetchSmartlinks() {
    try {
      const data = await api.admin.getSmartlinks();
      setSmartlinks(data);
    } catch (error) {
      console.error('Failed to fetch smartlinks:', error);
      toast.error('Failed to load smartlinks');
    }
    setLoading(false);
  }

  function resetForm() {
    setFormData({ url: '', name: '', weight: 1, is_active: true });
    setShowForm(false);
    setEditingId(null);
  }

  function handleEdit(link: Smartlink) {
    setFormData({
      url: link.url,
      name: link.name || '',
      weight: link.weight,
      is_active: link.is_active
    });
    setEditingId(link.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.url.trim()) {
      toast.error('URL is required');
      return;
    }

    try {
      new URL(formData.url);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        url: formData.url.trim(),
        name: formData.name.trim() || null,
        weight: Math.max(1, formData.weight),
        is_active: formData.is_active
      };

      if (editingId) {
        await api.admin.updateSmartlink(editingId, payload);
        toast.success('Smartlink updated');
      } else {
        await api.admin.createSmartlink(payload);
        toast.success('Smartlink added');
      }

      resetForm();
      fetchSmartlinks();
    } catch (error) {
      console.error('Failed to save smartlink:', error);
      toast.error('Failed to save smartlink');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this smartlink?')) return;

    try {
      await api.admin.deleteSmartlink(id);
      toast.success('Smartlink deleted');
      fetchSmartlinks();
    } catch (error) {
      console.error('Failed to delete smartlink:', error);
      toast.error('Failed to delete smartlink');
    }
  }

  async function handleToggleActive(link: Smartlink) {
    try {
      await api.admin.updateSmartlink(link.id, { is_active: !link.is_active });
      toast.success(link.is_active ? 'Smartlink disabled' : 'Smartlink enabled');
      fetchSmartlinks();
    } catch (error) {
      console.error('Failed to toggle smartlink:', error);
      toast.error('Failed to update smartlink');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const activeCount = smartlinks.filter(l => l.is_active).length;
  const totalWeight = smartlinks.filter(l => l.is_active).reduce((sum, l) => sum + l.weight, 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Smartlink Manager</h2>
        <p className="text-muted-foreground">Manage multiple ad smartlinks with weighted rotation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-primary">{smartlinks.length}</p>
          <p className="text-sm text-muted-foreground">Total Smartlinks</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{activeCount}</p>
          <p className="text-sm text-muted-foreground">Active</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-accent">{totalWeight}</p>
          <p className="text-sm text-muted-foreground">Total Weight</p>
        </div>
      </div>

      {showForm && (
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">
              {editingId ? 'Edit Smartlink' : 'Add New Smartlink'}
            </h3>
            <button
              onClick={resetForm}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Smartlink URL *</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://www.profitablecpmgate.com/your-link"
                className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Name (optional)</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Adsterra Main"
                  className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Weight</label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 1 })}
                  min={1}
                  className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <p className="text-xs text-muted-foreground">Higher weight = more frequent selection</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-primary rounded"
                />
                <span className="text-foreground">Active</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 px-4 py-3 rounded-xl border border-border text-muted-foreground font-medium hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 btn-neon flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    {editingId ? 'Update' : 'Add Smartlink'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full glass rounded-xl p-4 flex items-center justify-center gap-2 text-primary hover:bg-primary/10 transition-colors border-2 border-dashed border-primary/30"
        >
          <Plus className="w-5 h-5" />
          Add New Smartlink
        </button>
      )}

      <div className="glass rounded-2xl overflow-hidden">
        <div className="bg-muted/50 px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Smartlinks</h3>
              <p className="text-sm text-muted-foreground">
                {smartlinks.length === 0 
                  ? 'No smartlinks configured yet' 
                  : `${smartlinks.length} smartlink${smartlinks.length === 1 ? '' : 's'} configured`}
              </p>
            </div>
          </div>
        </div>

        {smartlinks.length === 0 ? (
          <div className="p-8 text-center">
            <Link2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-medium mb-1">No smartlinks yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first smartlink to enable ad rotation
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {smartlinks.map((link) => {
              const probability = link.is_active && totalWeight > 0 
                ? ((link.weight / totalWeight) * 100).toFixed(1) 
                : '0';
              
              return (
                <div key={link.id} className="p-4 flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${link.is_active ? 'bg-green-400' : 'bg-muted-foreground'}`} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-foreground truncate">
                        {link.name || 'Unnamed Smartlink'}
                      </p>
                      {link.is_active && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                          {probability}% chance
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{link.url}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>Weight: {link.weight}</span>
                      <span>Added: {new Date(link.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      title="Open link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleToggleActive(link)}
                      className={`p-2 rounded-lg transition-colors ${
                        link.is_active 
                          ? 'hover:bg-yellow-500/10 text-yellow-400' 
                          : 'hover:bg-green-500/10 text-green-400'
                      }`}
                      title={link.is_active ? 'Disable' : 'Enable'}
                    >
                      {link.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleEdit(link)}
                      className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="glass rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold text-foreground">How Rotation Works</h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Weighted Random Selection:</span> Each smartlink has a weight that determines how often it's shown. Higher weight = more frequent selection.
          </p>
          <p>
            <span className="font-medium text-foreground">Anti-Repeat:</span> The system avoids showing the same smartlink twice in a row per user session.
          </p>
          <p>
            <span className="font-medium text-foreground">Fallback:</span> If no smartlinks are configured, the system falls back to the default Adsterra smartlink in settings.
          </p>
        </div>
      </div>
    </div>
  );
}

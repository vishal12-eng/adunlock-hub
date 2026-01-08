import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { api, Content } from '@/lib/api';
import { 
  Zap, 
  LayoutDashboard, 
  FileBox, 
  Settings, 
  LogOut,
  Eye,
  Download,
  TrendingUp,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  BarChart2,
  FlaskConical,
  Users,
  ShoppingBag,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';
import { ContentFormModal } from '@/components/admin/ContentFormModal';
import { SettingsPanel } from '@/components/admin/SettingsPanel';
import { AdminAnalytics } from '@/components/AdminAnalytics';
import { ABTestingPanel } from '@/components/admin/ABTestingPanel';
import { ReferralAdminPanel } from '@/components/admin/ReferralAdminPanel';
import { ShopSettingsPanel } from '@/components/admin/ShopSettingsPanel';
import { EmailSubscribersPanel } from '@/components/admin/EmailSubscribersPanel';
import { ShopAnalytics } from '@/components/admin/ShopAnalytics';
import { EmailNotificationsPanel } from '@/components/admin/EmailNotificationsPanel';

interface Stats {
  totalContents: number;
  totalViews: number;
  totalUnlocks: number;
  estimatedEarnings: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading, signOut } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'contents' | 'abtesting' | 'referrals' | 'shop' | 'subscribers' | 'settings'>('dashboard');
  const [contents, setContents] = useState<Content[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalContents: 0,
    totalViews: 0,
    totalUnlocks: 0,
    estimatedEarnings: 0
  });
  const [loading, setLoading] = useState(true);
  const [showContentModal, setShowContentModal] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/panel-adnexus-9f3x/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchData();
    }
  }, [user, isAdmin]);

  async function fetchData() {
    setLoading(true);
    
    try {
      const contentsData = await api.admin.getContents();
      setContents(contentsData);
      
      const totalViews = contentsData.reduce((sum, c) => sum + c.views, 0);
      const totalUnlocks = contentsData.reduce((sum, c) => sum + c.unlocks, 0);
      
      setStats({
        totalContents: contentsData.length,
        totalViews,
        totalUnlocks,
        estimatedEarnings: totalUnlocks * 0.05
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }

    setLoading(false);
  }

  async function handleDeleteContent(id: string) {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      await api.admin.deleteContent(id);
      toast.success('Content deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete content');
    }
  }

  async function handleToggleStatus(content: Content) {
    const newStatus = content.status === 'active' ? 'inactive' : 'active';
    
    try {
      await api.admin.updateContent(content.id, { status: newStatus });
      toast.success(`Content ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate('/panel-adnexus-9f3x/login');
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-intense rounded-2xl p-8 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-6">
            You don't have admin privileges. Contact the administrator to get access.
          </p>
          <button
            onClick={handleSignOut}
            className="btn-neon"
            data-testid="button-signout"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 glass-intense border-r border-border p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-gradient-neon flex items-center justify-center">
            <Zap className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-foreground">ADNEXUS</h1>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'dashboard' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            data-testid="nav-dashboard"
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('contents')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'contents' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            data-testid="nav-contents"
          >
            <FileBox className="w-5 h-5" />
            Content Manager
          </button>
          <button
            onClick={() => setActiveTab('abtesting')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'abtesting' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            data-testid="nav-abtesting"
          >
            <FlaskConical className="w-5 h-5" />
            A/B Testing
          </button>
          <button
            onClick={() => setActiveTab('referrals')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'referrals' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            data-testid="nav-referrals"
          >
            <Users className="w-5 h-5" />
            Referrals
          </button>
          <button
            onClick={() => setActiveTab('shop')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'shop' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            data-testid="nav-shop"
          >
            <ShoppingBag className="w-5 h-5" />
            Shop & Rewards
          </button>
          <button
            onClick={() => setActiveTab('subscribers')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'subscribers' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            data-testid="nav-subscribers"
          >
            <Mail className="w-5 h-5" />
            Subscribers
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'settings' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            data-testid="nav-settings"
          >
            <Settings className="w-5 h-5" />
            Ad Settings
          </button>
        </nav>

        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2 truncate">{user?.email}</p>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
            data-testid="button-logout"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Dashboard</h2>
              <p className="text-muted-foreground">Overview of your content platform</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <FileBox className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Contents</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="stat-contents">{stats.totalContents}</p>
                  </div>
                </div>
              </div>
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                    <Eye className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Views</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="stat-views">{stats.totalViews}</p>
                  </div>
                </div>
              </div>
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Download className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Unlocks</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="stat-unlocks">{stats.totalUnlocks}</p>
                  </div>
                </div>
              </div>
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Est. Earnings</p>
                    <p className="text-2xl font-bold text-foreground">${stats.estimatedEarnings.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Analytics Section */}
            <AdminAnalytics 
              data={{
                totalContents: stats.totalContents,
                totalViews: stats.totalViews,
                totalUnlocks: stats.totalUnlocks,
                estimatedEarnings: stats.estimatedEarnings,
                contents: contents.map(c => ({
                  id: c.id,
                  title: c.title,
                  views: c.views,
                  unlocks: c.unlocks,
                  required_ads: c.required_ads
                }))
              }}
            />

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Recent Content</h3>
              <div className="glass rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Title</th>
                      <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Status</th>
                      <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Views</th>
                      <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Unlocks</th>
                      <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Conv. Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contents.slice(0, 5).map((content) => {
                      const convRate = content.views > 0 
                        ? ((content.unlocks / content.views) * 100).toFixed(1) 
                        : '0';
                      return (
                        <tr key={content.id} className="border-t border-border">
                          <td className="px-6 py-4 text-foreground">{content.title}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              content.status === 'active' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {content.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">{content.views}</td>
                          <td className="px-6 py-4 text-muted-foreground">{content.unlocks}</td>
                          <td className="px-6 py-4">
                            <span className={`font-medium ${
                              parseFloat(convRate) >= 10 ? 'text-green-400' : 
                              parseFloat(convRate) >= 5 ? 'text-yellow-400' : 'text-muted-foreground'
                            }`}>
                              {convRate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {contents.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                          No content yet. Add your first content!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contents' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Content Manager</h2>
                <p className="text-muted-foreground">Manage your locked content</p>
              </div>
              <button
                onClick={() => {
                  setEditingContent(null);
                  setShowContentModal(true);
                }}
                className="btn-neon flex items-center gap-2"
                data-testid="button-add-content"
              >
                <Plus className="w-5 h-5" />
                Add Content
              </button>
            </div>

            <div className="glass rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Content</th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Ads</th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Status</th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Stats</th>
                    <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contents.map((content) => (
                    <tr key={content.id} className="border-t border-border">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {content.thumbnail_url ? (
                              <img 
                                src={content.thumbnail_url} 
                                alt="" 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FileBox className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{content.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {content.redirect_url ? 'Redirect Link' : content.file_url ? 'File Download' : 'No link set'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 glass rounded-full text-sm font-medium text-primary">
                          {content.required_ads} ads
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(content)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            content.status === 'active' 
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {content.status}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {content.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="w-4 h-4" />
                            {content.unlocks}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {(content.redirect_url || content.file_url) && (
                            <a
                              href={content.redirect_url || content.file_url || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => {
                              setEditingContent(content);
                              setShowContentModal(true);
                            }}
                            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            data-testid={`button-edit-${content.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteContent(content.id)}
                            className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                            data-testid={`button-delete-${content.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {contents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <FileBox className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-foreground font-medium mb-1">No content yet</p>
                        <p className="text-sm text-muted-foreground">
                          Add your first content to get started
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'abtesting' && (
          <ABTestingPanel />
        )}

        {activeTab === 'referrals' && (
          <ReferralAdminPanel />
        )}

        {activeTab === 'shop' && (
          <div className="space-y-8">
            <ShopAnalytics />
            <ShopSettingsPanel />
          </div>
        )}

        {activeTab === 'subscribers' && (
          <div className="space-y-8">
            <EmailNotificationsPanel />
            <EmailSubscribersPanel />
          </div>
        )}

        {activeTab === 'settings' && (
          <SettingsPanel />
        )}
      </main>

      <ContentFormModal
        isOpen={showContentModal}
        onClose={() => {
          setShowContentModal(false);
          setEditingContent(null);
        }}
        content={editingContent}
        onSuccess={() => {
          setShowContentModal(false);
          setEditingContent(null);
          fetchData();
        }}
      />
    </div>
  );
}

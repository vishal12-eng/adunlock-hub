import { useState, useEffect } from 'react';
import { 
  Bell, 
  Send, 
  Mail, 
  Settings, 
  Users, 
  TestTube,
  Loader2,
  Check,
  AlertCircle,
  Sparkles,
  Gift,
  TrendingUp,
  Megaphone,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { api, Content } from '@/lib/api';

interface EmailSettings {
  newsletter_enabled: boolean;
  auto_notify_new_content: boolean;
  daily_digest_enabled: boolean;
  weekly_digest_enabled: boolean;
}

interface Subscriber {
  email: string;
  source: string;
  subscribed_at: string;
  preferences?: {
    new_content?: boolean;
    daily_rewards?: boolean;
    updates?: boolean;
    frequency?: string;
  };
}

const DEFAULT_SETTINGS: EmailSettings = {
  newsletter_enabled: true,
  auto_notify_new_content: false,
  daily_digest_enabled: false,
  weekly_digest_enabled: false,
};

const SETTINGS_KEY = 'adnexus_email_notification_settings';

function loadSettings(): EmailSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: EmailSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function EmailNotificationsPanel() {
  const [settings, setSettings] = useState<EmailSettings>(loadSettings);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [selectedContent, setSelectedContent] = useState<string>('');
  const [campaignType, setCampaignType] = useState<'new_content' | 'trending' | 'daily_rewards' | 'update'>('new_content');
  const [customMessage, setCustomMessage] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingCampaign, setSendingCampaign] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    
    // Load subscribers from localStorage
    const emails = JSON.parse(localStorage.getItem('collected_emails') || '[]');
    setSubscribers(emails.map((e: any) => ({
      email: e.email,
      source: e.source || 'unknown',
      subscribed_at: new Date(e.timestamp).toISOString(),
      preferences: e.preferences,
    })));

    // Load contents for selection
    try {
      const contentData = await api.admin.getContents();
      setContents(contentData);
    } catch (error) {
      console.error('Failed to load contents:', error);
    }

    setLoading(false);
  }

  function handleSettingChange<K extends keyof EmailSettings>(key: K, value: EmailSettings[K]) {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
    toast.success('Settings saved');
  }

  async function handleSendTestEmail() {
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSendingTest(true);
    
    // Simulate sending (in production, this would trigger n8n workflow)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success(`Test email sent to ${testEmail}`);
    setSendingTest(false);
  }

  async function handleSendCampaign() {
    if (subscribers.length === 0) {
      toast.error('No subscribers to send to');
      return;
    }

    if (campaignType === 'new_content' && !selectedContent) {
      toast.error('Please select content to notify about');
      return;
    }

    setSendingCampaign(true);

    // Get selected content details
    const content = contents.find(c => c.id === selectedContent);

    // Prepare webhook payload for n8n
    const webhookPayload = {
      type: campaignType,
      content_id: content?.id,
      content_title: content?.title,
      content_thumbnail: content?.thumbnail_url,
      message: customMessage,
      recipients: subscribers.map(s => s.email),
      total_recipients: subscribers.length,
      sent_at: new Date().toISOString(),
    };

    console.log('[Email Campaign] Payload for n8n:', webhookPayload);

    // Store campaign in history
    const campaigns = JSON.parse(localStorage.getItem('adnexus_email_campaigns') || '[]');
    campaigns.push({
      ...webhookPayload,
      id: Date.now().toString(),
      status: 'sent',
    });
    localStorage.setItem('adnexus_email_campaigns', JSON.stringify(campaigns));

    // Simulate sending delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    toast.success(`Campaign sent to ${subscribers.length} subscribers!`);
    setSendingCampaign(false);
    setCustomMessage('');
  }

  // Count subscribers by preference
  const subscribersByPreference = {
    new_content: subscribers.filter(s => s.preferences?.new_content !== false).length,
    daily_rewards: subscribers.filter(s => s.preferences?.daily_rewards !== false).length,
    updates: subscribers.filter(s => s.preferences?.updates !== false).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Email Notifications</h2>
        <p className="text-muted-foreground">
          Manage email campaigns and subscriber notifications via n8n
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{subscribers.length}</p>
                <p className="text-sm text-muted-foreground">Total Subscribers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{subscribersByPreference.new_content}</p>
                <p className="text-sm text-muted-foreground">Want New Content</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Gift className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{subscribersByPreference.daily_rewards}</p>
                <p className="text-sm text-muted-foreground">Want Rewards</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Megaphone className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{subscribersByPreference.updates}</p>
                <p className="text-sm text-muted-foreground">Want Updates</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaign" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="campaign" className="gap-2">
            <Send className="w-4 h-4" />
            Send Campaign
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="test" className="gap-2">
            <TestTube className="w-4 h-4" />
            Test Email
          </TabsTrigger>
        </TabsList>

        {/* Send Campaign Tab */}
        <TabsContent value="campaign">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" />
                Send Email Campaign
              </CardTitle>
              <CardDescription>
                Notify subscribers about new content, rewards, or updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Campaign Type */}
              <div className="space-y-2">
                <Label>Campaign Type</Label>
                <Select value={campaignType} onValueChange={(v: any) => setCampaignType(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select campaign type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new_content">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        🆕 New Premium Content
                      </div>
                    </SelectItem>
                    <SelectItem value="trending">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-orange-400" />
                        🔥 Trending Content
                      </div>
                    </SelectItem>
                    <SelectItem value="daily_rewards">
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-green-400" />
                        🎁 Daily Rewards Reminder
                      </div>
                    </SelectItem>
                    <SelectItem value="update">
                      <div className="flex items-center gap-2">
                        <Megaphone className="w-4 h-4 text-purple-400" />
                        📢 Important Update
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Content Selection (for new_content and trending) */}
              {(campaignType === 'new_content' || campaignType === 'trending') && (
                <div className="space-y-2">
                  <Label>Select Content</Label>
                  <Select value={selectedContent} onValueChange={setSelectedContent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose content to notify about" />
                    </SelectTrigger>
                    <SelectContent>
                      {contents.map(content => (
                        <SelectItem key={content.id} value={content.id}>
                          {content.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Custom Message */}
              <div className="space-y-2">
                <Label>Custom Message (optional)</Label>
                <Textarea
                  placeholder="Add a personal message to your subscribers..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={3}
                  className="bg-secondary/50"
                />
              </div>

              {/* Audience Preview */}
              <div className="bg-muted/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Target Audience</p>
                    <p className="text-sm text-muted-foreground">
                      Based on subscriber preferences
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {campaignType === 'new_content' ? subscribersByPreference.new_content :
                       campaignType === 'daily_rewards' ? subscribersByPreference.daily_rewards :
                       subscribers.length}
                    </p>
                    <p className="text-sm text-muted-foreground">recipients</p>
                  </div>
                </div>
              </div>

              {/* Send Button */}
              <Button 
                className="w-full gap-2" 
                onClick={handleSendCampaign}
                disabled={sendingCampaign || subscribers.length === 0}
              >
                {sendingCampaign ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending Campaign...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send to {subscribers.length} Subscribers
                  </>
                )}
              </Button>

              {/* n8n Note */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-400 mb-1">n8n Integration Required</p>
                    <p className="text-muted-foreground">
                      Campaigns are sent via n8n workflows. Make sure your n8n instance is 
                      configured with the newsletter webhook endpoint.
                    </p>
                    <a 
                      href="/docs/n8n-integration.md" 
                      target="_blank" 
                      className="inline-flex items-center gap-1 text-blue-400 hover:underline mt-2"
                    >
                      View n8n Setup Guide
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure automatic email notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Newsletter Enabled</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow users to subscribe to email updates
                  </p>
                </div>
                <Switch
                  checked={settings.newsletter_enabled}
                  onCheckedChange={(checked) => handleSettingChange('newsletter_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-notify New Content</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically notify subscribers when new content is added
                  </p>
                </div>
                <Switch
                  checked={settings.auto_notify_new_content}
                  onCheckedChange={(checked) => handleSettingChange('auto_notify_new_content', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Daily Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Send daily summary of new content and rewards
                  </p>
                </div>
                <Switch
                  checked={settings.daily_digest_enabled}
                  onCheckedChange={(checked) => handleSettingChange('daily_digest_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Send weekly summary of popular content
                  </p>
                </div>
                <Switch
                  checked={settings.weekly_digest_enabled}
                  onCheckedChange={(checked) => handleSettingChange('weekly_digest_enabled', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Email Tab */}
        <TabsContent value="test">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="w-5 h-5 text-primary" />
                Send Test Email
              </CardTitle>
              <CardDescription>
                Test email delivery before sending campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-email">Email Address</Label>
                <Input
                  id="test-email"
                  type="email"
                  placeholder="your@email.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="bg-secondary/50"
                />
              </div>

              <Button 
                onClick={handleSendTestEmail} 
                disabled={sendingTest}
                className="gap-2"
              >
                {sendingTest ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Send Test Email
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Mail, 
  Copy, 
  Check, 
  Download, 
  Users, 
  Search,
  Trash2,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface EmailSubscriber {
  email: string;
  timestamp: number;
  bonusClaimed?: boolean;
}

// Get subscribers from localStorage (in production, this would be from database)
function getSubscribers(): EmailSubscriber[] {
  try {
    const stored = localStorage.getItem('collected_emails');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  return [];
}

// Save subscribers to localStorage
function saveSubscribers(subscribers: EmailSubscriber[]): void {
  localStorage.setItem('collected_emails', JSON.stringify(subscribers));
}

export function EmailSubscribersPanel() {
  const [subscribers, setSubscribers] = useState<EmailSubscriber[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [copiedAll, setCopiedAll] = useState(false);
  
  useEffect(() => {
    loadSubscribers();
  }, []);
  
  const loadSubscribers = () => {
    setSubscribers(getSubscribers());
  };
  
  const filteredSubscribers = subscribers.filter(sub => 
    sub.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const toggleSelect = (email: string) => {
    const newSelected = new Set(selectedEmails);
    if (newSelected.has(email)) {
      newSelected.delete(email);
    } else {
      newSelected.add(email);
    }
    setSelectedEmails(newSelected);
  };
  
  const selectAll = () => {
    if (selectedEmails.size === filteredSubscribers.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(filteredSubscribers.map(s => s.email)));
    }
  };
  
  const copyEmails = async (emails: string[]) => {
    const emailsText = emails.join(', ');
    try {
      await navigator.clipboard.writeText(emailsText);
      toast.success(`Copied ${emails.length} email${emails.length !== 1 ? 's' : ''}!`);
      return true;
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = emailsText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success(`Copied ${emails.length} email${emails.length !== 1 ? 's' : ''}!`);
      return true;
    }
  };
  
  const copyAllEmails = async () => {
    const emails = filteredSubscribers.map(s => s.email);
    const success = await copyEmails(emails);
    if (success) {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };
  
  const copySelectedEmails = async () => {
    const emails = Array.from(selectedEmails);
    await copyEmails(emails);
  };
  
  const exportCSV = () => {
    const headers = ['Email', 'Subscribed At', 'Bonus Claimed'];
    const rows = filteredSubscribers.map(sub => [
      sub.email,
      new Date(sub.timestamp).toISOString(),
      sub.bonusClaimed ? 'Yes' : 'No'
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    URL.revokeObjectURL(url);
    toast.success('Exported subscribers to CSV');
  };
  
  const deleteSubscriber = (email: string) => {
    if (!confirm(`Delete ${email} from subscribers?`)) return;
    
    const updated = subscribers.filter(s => s.email !== email);
    saveSubscribers(updated);
    setSubscribers(updated);
    selectedEmails.delete(email);
    setSelectedEmails(new Set(selectedEmails));
    toast.success('Subscriber removed');
  };
  
  const deleteSelected = () => {
    if (!confirm(`Delete ${selectedEmails.size} selected subscriber(s)?`)) return;
    
    const updated = subscribers.filter(s => !selectedEmails.has(s.email));
    saveSubscribers(updated);
    setSubscribers(updated);
    setSelectedEmails(new Set());
    toast.success('Selected subscribers removed');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">Email Subscribers</h2>
          <p className="text-muted-foreground">
            Manage your newsletter subscribers ({subscribers.length} total)
          </p>
        </div>
        <Button onClick={loadSubscribers} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{subscribers.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {subscribers.filter(s => s.bonusClaimed).length}
                </p>
                <p className="text-xs text-muted-foreground">Claimed Bonus</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {subscribers.filter(s => 
                    Date.now() - s.timestamp < 7 * 24 * 60 * 60 * 1000
                  ).length}
                </p>
                <p className="text-xs text-muted-foreground">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {subscribers.filter(s => 
                    Date.now() - s.timestamp < 24 * 60 * 60 * 1000
                  ).length}
                </p>
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Actions Bar */}
      <Card className="glass">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={copyAllEmails}
                className="gap-2"
              >
                {copiedAll ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy All ({filteredSubscribers.length})
                  </>
                )}
              </Button>
              
              {selectedEmails.size > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copySelectedEmails}
                    className="gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Selected ({selectedEmails.size})
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={deleteSelected}
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={exportCSV}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Subscribers Table */}
      <Card className="glass">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Subscribers List
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={selectAll}
              className="text-xs"
            >
              {selectedEmails.size === filteredSubscribers.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSubscribers.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium text-foreground mb-1">
                {searchQuery ? 'No matching subscribers' : 'No subscribers yet'}
              </p>
              <p className="text-sm text-muted-foreground">
                {searchQuery 
                  ? 'Try a different search term' 
                  : 'Subscribers will appear here when users sign up'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredSubscribers.map((subscriber, index) => (
                <div
                  key={subscriber.email}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer",
                    selectedEmails.has(subscriber.email)
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-secondary/30 hover:bg-secondary/50 border border-transparent"
                  )}
                  onClick={() => toggleSelect(subscriber.email)}
                >
                  {/* Checkbox */}
                  <div className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all",
                    selectedEmails.has(subscriber.email)
                      ? "bg-primary border-primary"
                      : "border-border"
                  )}>
                    {selectedEmails.has(subscriber.email) && (
                      <Check className="w-3 h-3 text-primary-foreground" />
                    )}
                  </div>
                  
                  {/* Email */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{subscriber.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(subscriber.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                  
                  {/* Badge */}
                  {subscriber.bonusClaimed && (
                    <Badge variant="secondary" className="text-xs">
                      Bonus Claimed
                    </Badge>
                  )}
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyEmails([subscriber.email])}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteSubscriber(subscriber.email)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Quick Copy Box */}
      {filteredSubscribers.length > 0 && (
        <Card className="glass border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Copy className="w-4 h-4 text-primary" />
              Quick Copy All Emails
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-secondary/50 rounded-lg overflow-x-auto">
              <code className="text-sm text-foreground break-all">
                {filteredSubscribers.map(s => s.email).join(', ')}
              </code>
            </div>
            <Button
              onClick={copyAllEmails}
              className="w-full mt-3 gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy to Clipboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

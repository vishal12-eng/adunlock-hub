import { useState, useEffect } from 'react';
import { Bell, BellOff, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// DB CHANGE NEEDED: Create 'push_subscriptions' table with columns:
// - id (uuid), session_id (text), endpoint (text), p256dh (text), auth (text),
// - subscribed_at (timestamp), unsubscribed_at (timestamp nullable)
// BACKEND CHANGE NEEDED: Create edge function to send push notifications using web-push library
// BACKEND CHANGE NEEDED: Store VAPID keys in secrets

const STORAGE_KEY = 'adnexus_push_enabled';
const PROMPT_SHOWN_KEY = 'adnexus_push_prompt_shown';

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

function getNotificationPermission(): PermissionState {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission as PermissionState;
}

function isPushEnabled(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

function setPushEnabled(enabled: boolean) {
  localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
}

function hasPromptShown(): boolean {
  return sessionStorage.getItem(PROMPT_SHOWN_KEY) === 'true';
}

function markPromptShown() {
  sessionStorage.setItem(PROMPT_SHOWN_KEY, 'true');
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<PermissionState>('default');
  const [isEnabled, setIsEnabled] = useState(false);
  
  useEffect(() => {
    setPermission(getNotificationPermission());
    setIsEnabled(isPushEnabled() && getNotificationPermission() === 'granted');
  }, []);
  
  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      toast.error('Push notifications are not supported in your browser');
      return false;
    }
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result as PermissionState);
      
      if (result === 'granted') {
        setPushEnabled(true);
        setIsEnabled(true);
        
        // Show a test notification
        new Notification('ADNEXUS', {
          body: 'You\'ll now receive notifications about new content!',
          icon: '/favicon-192.png',
        });
        
        toast.success('Notifications enabled!');
        return true;
      } else if (result === 'denied') {
        toast.error('Notifications blocked. Enable them in browser settings.');
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      toast.error('Failed to enable notifications');
      return false;
    }
  };
  
  const disable = () => {
    setPushEnabled(false);
    setIsEnabled(false);
    toast.success('Notifications disabled');
  };
  
  const sendLocalNotification = (title: string, body: string, options?: NotificationOptions) => {
    if (permission === 'granted' && isEnabled) {
      new Notification(title, {
        body,
        icon: '/favicon-192.png',
        ...options,
      });
    }
  };
  
  return {
    permission,
    isEnabled,
    isSupported: permission !== 'unsupported',
    requestPermission,
    disable,
    sendLocalNotification,
  };
}

interface PushNotificationPromptProps {
  onDismiss?: () => void;
}

export function PushNotificationPrompt({ onDismiss }: PushNotificationPromptProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { permission, isEnabled, isSupported, requestPermission } = usePushNotifications();
  
  useEffect(() => {
    // Show prompt after delay if not already granted/denied
    if (isSupported && permission === 'default' && !hasPromptShown()) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        markPromptShown();
      }, 45000); // Show after 45 seconds
      
      return () => clearTimeout(timer);
    }
  }, [isSupported, permission]);
  
  const handleEnable = async () => {
    await requestPermission();
    setIsVisible(false);
  };
  
  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };
  
  if (!isVisible || !isSupported || permission !== 'default') {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="glass-intense rounded-xl p-4 border border-primary/20 shadow-lg shadow-primary/10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-foreground mb-1">Stay Updated!</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Get notified when new premium content is available.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleEnable} className="gap-1">
                <Bell className="w-3 h-3" />
                Enable
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                Not now
              </Button>
            </div>
          </div>
          <button 
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Toggle button for settings/header
export function PushNotificationToggle() {
  const { permission, isEnabled, isSupported, requestPermission, disable } = usePushNotifications();
  
  if (!isSupported) {
    return null;
  }
  
  const handleToggle = async () => {
    if (isEnabled) {
      disable();
    } else if (permission === 'granted') {
      setPushEnabled(true);
      toast.success('Notifications enabled!');
    } else {
      await requestPermission();
    }
  };
  
  return (
    <button
      onClick={handleToggle}
      className={`p-2 rounded-lg transition-colors ${
        isEnabled 
          ? 'bg-primary/20 text-primary' 
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
      title={isEnabled ? 'Disable notifications' : 'Enable notifications'}
    >
      {isEnabled ? (
        <Bell className="w-5 h-5" />
      ) : (
        <BellOff className="w-5 h-5" />
      )}
    </button>
  );
}

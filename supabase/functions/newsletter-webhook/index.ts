import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubscribePayload {
  email: string;
  source?: string;
  preferences?: {
    new_content?: boolean;
    daily_rewards?: boolean;
    updates?: boolean;
    frequency?: 'instant' | 'daily' | 'weekly';
  };
}

interface NotifyPayload {
  type: 'new_content' | 'trending' | 'daily_rewards' | 'update';
  content_id?: string;
  content_title?: string;
  content_thumbnail?: string;
  message?: string;
}

interface UnsubscribePayload {
  email: string;
  token: string;
}

// Generate a simple unsubscribe token
function generateUnsubscribeToken(email: string): string {
  const data = `${email}-${Date.now()}-adnexus`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.pathname.split('/').pop() || 'subscribe';
    
    console.log(`[Newsletter Webhook] Action: ${action}, Method: ${req.method}`);

    // GET endpoint for n8n to fetch subscribers
    if (req.method === 'GET' && action === 'subscribers') {
      // This endpoint is for n8n to fetch all subscribers
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Get from settings (stored as JSON)
      const { data: settings } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'email_subscribers')
        .single();

      const subscribers = settings?.value ? JSON.parse(settings.value) : [];
      const activeSubscribers = subscribers.filter((s: any) => !s.unsubscribed);

      console.log(`[Newsletter] Returning ${activeSubscribers.length} active subscribers`);

      return new Response(
        JSON.stringify({
          success: true,
          count: activeSubscribers.length,
          subscribers: activeSubscribers.map((s: any) => ({
            email: s.email,
            source: s.source,
            preferences: s.preferences,
            subscribed_at: s.subscribed_at,
          })),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST endpoints
    if (req.method === 'POST') {
      const body = await req.json();

      // Subscribe endpoint
      if (action === 'subscribe') {
        const payload = body as SubscribePayload;
        
        if (!payload.email || !isValidEmail(payload.email)) {
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid email address' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get existing subscribers from settings
        const { data: settings } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'email_subscribers')
          .single();

        let subscribers = settings?.value ? JSON.parse(settings.value) : [];
        
        // Check if already subscribed
        const existingIndex = subscribers.findIndex(
          (s: any) => s.email.toLowerCase() === payload.email.toLowerCase()
        );

        const unsubscribeToken = generateUnsubscribeToken(payload.email);
        const subscriberData = {
          email: payload.email.toLowerCase().trim(),
          source: payload.source || 'unknown',
          preferences: payload.preferences || {
            new_content: true,
            daily_rewards: true,
            updates: true,
            frequency: 'instant',
          },
          subscribed_at: new Date().toISOString(),
          unsubscribe_token: unsubscribeToken,
          unsubscribed: false,
        };

        if (existingIndex >= 0) {
          // Resubscribe if previously unsubscribed
          if (subscribers[existingIndex].unsubscribed) {
            subscribers[existingIndex] = { ...subscribers[existingIndex], ...subscriberData };
          } else {
            return new Response(
              JSON.stringify({ success: true, message: 'Already subscribed', duplicate: true }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } else {
          subscribers.push(subscriberData);
        }

        // Save to settings
        await supabase
          .from('site_settings')
          .upsert({
            key: 'email_subscribers',
            value: JSON.stringify(subscribers),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'key' });

        console.log(`[Newsletter] New subscriber: ${payload.email} from ${payload.source}`);

        // Return data for n8n to send welcome email
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Subscribed successfully',
            subscriber: {
              email: payload.email,
              source: payload.source,
              unsubscribe_token: unsubscribeToken,
              preferences: subscriberData.preferences,
            },
            // Webhook data for n8n
            webhook_trigger: 'new_subscription',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Unsubscribe endpoint
      if (action === 'unsubscribe') {
        const payload = body as UnsubscribePayload;
        
        if (!payload.email) {
          return new Response(
            JSON.stringify({ success: false, error: 'Email required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: settings } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'email_subscribers')
          .single();

        let subscribers = settings?.value ? JSON.parse(settings.value) : [];
        
        const index = subscribers.findIndex(
          (s: any) => s.email.toLowerCase() === payload.email.toLowerCase()
        );

        if (index >= 0) {
          subscribers[index].unsubscribed = true;
          subscribers[index].unsubscribed_at = new Date().toISOString();

          await supabase
            .from('site_settings')
            .upsert({
              key: 'email_subscribers',
              value: JSON.stringify(subscribers),
              updated_at: new Date().toISOString(),
            }, { onConflict: 'key' });

          console.log(`[Newsletter] Unsubscribed: ${payload.email}`);
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Unsubscribed successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Notify endpoint (for n8n to trigger)
      if (action === 'notify') {
        const payload = body as NotifyPayload;
        
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get all active subscribers
        const { data: settings } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'email_subscribers')
          .single();

        const subscribers = settings?.value ? JSON.parse(settings.value) : [];
        const activeSubscribers = subscribers.filter((s: any) => {
          if (s.unsubscribed) return false;
          
          // Filter by preference type
          if (payload.type === 'new_content' && !s.preferences?.new_content) return false;
          if (payload.type === 'daily_rewards' && !s.preferences?.daily_rewards) return false;
          if (payload.type === 'update' && !s.preferences?.updates) return false;
          
          return true;
        });

        console.log(`[Newsletter] Notify ${activeSubscribers.length} subscribers for ${payload.type}`);

        // Return data for n8n to process and send emails
        return new Response(
          JSON.stringify({
            success: true,
            type: payload.type,
            content: {
              id: payload.content_id,
              title: payload.content_title,
              thumbnail: payload.content_thumbnail,
              message: payload.message,
            },
            recipients: activeSubscribers.map((s: any) => ({
              email: s.email,
              unsubscribe_token: s.unsubscribe_token,
            })),
            total_recipients: activeSubscribers.length,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update preferences endpoint
      if (action === 'preferences') {
        const { email, preferences } = body;
        
        if (!email) {
          return new Response(
            JSON.stringify({ success: false, error: 'Email required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: settings } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'email_subscribers')
          .single();

        let subscribers = settings?.value ? JSON.parse(settings.value) : [];
        
        const index = subscribers.findIndex(
          (s: any) => s.email.toLowerCase() === email.toLowerCase()
        );

        if (index >= 0) {
          subscribers[index].preferences = { ...subscribers[index].preferences, ...preferences };

          await supabase
            .from('site_settings')
            .upsert({
              key: 'email_subscribers',
              value: JSON.stringify(subscribers),
              updated_at: new Date().toISOString(),
            }, { onConflict: 'key' });
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Preferences updated' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Newsletter Webhook] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

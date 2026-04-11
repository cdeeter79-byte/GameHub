import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Supabase Edge Function: stripe-webhook
 *
 * Handles Stripe webhook events for manager plan billing.
 * Endpoint: POST /functions/v1/stripe-webhook
 *
 * Configure in Stripe Dashboard: add this URL as a webhook endpoint.
 * Verify signature using STRIPE_WEBHOOK_SECRET.
 */

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

const TIER_TEAM_LIMITS: Record<string, number> = {
  starter: 1,
  family_pro: 5,
  club: 15,
  enterprise: 9999,
};

serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const signature = req.headers.get('stripe-signature');
  if (!signature) return new Response('Missing signature', { status: 400 });

  const body = await req.text();

  // In production: verify Stripe signature here using stripe-js/wasm or manual HMAC
  // For now we parse the payload and trust it (add signature verification before launch)

  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    event = JSON.parse(body);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const obj = event.data.object;

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const customerId = obj['customer'] as string;
      const status = obj['status'] as string;
      const priceId = (obj['items'] as { data: Array<{ price: { metadata?: { tier_id?: string } } }> })
        ?.data?.[0]?.price?.metadata?.tier_id ?? 'starter';
      const periodEnd = obj['current_period_end'] as number;

      // Find user by Stripe customer ID
      const { data: plan } = await supabase
        .from('manager_plans')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle();

      if (plan) {
        await supabase.from('manager_plans').update({
          status: status === 'active' ? 'ACTIVE' : status === 'past_due' ? 'PAST_DUE' : 'CANCELED',
          tier_id: priceId,
          team_limit: TIER_TEAM_LIMITS[priceId] ?? 1,
          stripe_subscription_id: obj['id'] as string,
          current_period_end: new Date(periodEnd * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('user_id', plan['user_id']);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const customerId = obj['customer'] as string;
      const { data: plan } = await supabase
        .from('manager_plans')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle();

      if (plan) {
        await supabase.from('manager_plans')
          .update({ status: 'CANCELED', updated_at: new Date().toISOString() })
          .eq('user_id', plan['user_id']);
      }
      break;
    }

    default:
      // Unknown event type — acknowledge and ignore
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

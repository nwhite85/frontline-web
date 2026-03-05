# Vercel Environment Variables

Copy these into the Vercel project settings before deploying.
All values can be found in your existing `.env.local`.

## Required

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (from Stripe dashboard) |
| `NEXT_PUBLIC_APP_URL` | Production URL: `https://frontlinefitness.co.uk` |

## Email (pick one)

| Variable | Description |
|---|---|
| `SMTP_HOST` | SMTP host (if using SMTP email) |
| `SMTP_PORT` | SMTP port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |

## Trainer Auth

| Variable | Description |
|---|---|
| `DEFAULT_TRAINER_ID` | UUID of the default trainer (Nick's user ID in Supabase) |

## Notes

- `VERCEL_OIDC_TOKEN` is auto-injected by Vercel — do NOT add manually
- Stripe webhook: after deploying, set up a webhook in Stripe dashboard pointing to `https://frontlinefitness.co.uk/api/webhooks/payment` with events: `payment_intent.succeeded`, `checkout.session.completed`, `customer.subscription.*`

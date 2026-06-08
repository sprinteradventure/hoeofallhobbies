# Deployment Guide - Hoe of All Hobbies

## Quick Path to Production (30 minutes)

### Phase 1: Prepare (5 min)
1. Create Supabase production project
2. Create Stripe production account
3. Create Vercel account
4. Ensure GitHub repo is ready

### Phase 2: Database (5 min)
1. In Supabase SQL Editor, run migrations:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
2. Get production API keys

### Phase 3: Environment (5 min)
In Vercel dashboard, add environment variables:
```
NEXT_PUBLIC_SUPABASE_URL=<production-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production-key>
SUPABASE_SERVICE_ROLE_KEY=<production-secret>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=<webhook-secret>
NEXT_PUBLIC_ADMIN_EMAIL=your@email.com
NEXT_PUBLIC_APP_URL=https://hoeofallhobbies.com
```

### Phase 4: Deploy (5 min)
1. Push code to GitHub
2. Import repo to Vercel
3. Vercel auto-deploys to vercel.app domain
4. Verify site loads and works

### Phase 5: Domain (5 min)
1. GoDaddy DNS → Add CNAME to Vercel
2. Vercel Domains → Add hoeofallhobbies.com
3. Wait for DNS propagation (24-48h)

### Phase 6: Webhooks (5 min)
1. Stripe Dashboard → Webhooks → Add endpoint
2. URL: https://hoeofallhobbies.com/api/stripe/webhook
3. Events: payment_intent.succeeded, charge.refunded

## Verification Checklist

- [ ] Supabase project created and migrations run
- [ ] Stripe production account set up
- [ ] Vercel connected to GitHub
- [ ] All env vars in Vercel
- [ ] Site deployed and loads at vercel.app URL
- [ ] Domain pointing to Vercel via CNAME
- [ ] SSL certificate active (green lock)
- [ ] Test user registration works
- [ ] Test product creation works
- [ ] Test checkout flow works
- [ ] Stripe webhooks configured
- [ ] Email notifications sending
- [ ] Admin dashboard accessible
- [ ] Analytics logging events

## Domain Configuration (GoDaddy)

1. Log in to GoDaddy
2. **My Products → Domains → hoeofallhobbies.com → Manage**
3. **Advanced Settings → DNS**
4. Add CNAME record:
   - Name: Leave blank (or use @)
   - Type: CNAME
   - Points to: cname.vercel-dns.com
   - TTL: 600 (or default)
5. Save
6. Wait 24-48 hours for propagation

## Troubleshooting

### Domain not working
```bash
# Check DNS propagation
dig hoeofallhobbies.com
nslookup hoeofallhobbies.com

# Should show Vercel's IP
```

### Payments failing
- Verify Stripe API keys are LIVE (not test)
- Check webhook secret matches Stripe
- Review Stripe logs for errors
- Confirm webhook endpoint is reachable

### Database errors
- Verify Supabase URL is production
- Check RLS policies enabled
- Confirm migrations completed
- Review Supabase logs

## Post-Launch Monitoring

### Daily
- Check Vercel dashboard for errors
- Review Stripe transaction logs
- Monitor site uptime

### Weekly  
- Review analytics
- Check customer feedback
- Update inventory
- Process payouts

### Monthly
- Audit database usage
- Review cost breakdown
- Plan optimizations
- Security review

## Cost Estimate (Monthly)

| Service | Cost | Notes |
|---------|------|-------|
| Vercel | $20 | Pro plan |
| Supabase | $25 | Pro plan |
| Stripe | 2.9% + $0.30 | Per transaction |
| Domain | $1.25 | GoDaddy renewal |
| **Total** | **$46+** | Before payments |

## Emergency Contacts

- Vercel: https://vercel.com/support
- Supabase: https://supabase.com/support
- Stripe: https://support.stripe.com
- GoDaddy: https://support.godaddy.com

---

**Status**: Ready for production
**Last Updated**: May 29, 2026

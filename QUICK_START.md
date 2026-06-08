# Quick Start - Get Running in 10 Minutes

## 1. Install (1 min)

```bash
cd "Hoe of all Hobbies"
npm install
```

## 2. Get Keys (2 min)

Sign up for free at:
- **Supabase**: https://supabase.com (New Project)
- **Stripe**: https://stripe.com (Get test keys)

Copy the keys to `.env.local` (see `.env.example`)

## 3. Setup Database (2 min)

Go to your Supabase dashboard → SQL Editor

Run this SQL (from `supabase/migrations/001_initial_schema.sql`):

```sql
-- Copy entire contents of migration file and paste here
```

Then run `supabase/migrations/002_rls_policies.sql`

## 4. Create .env.local (1 min)

```bash
cp .env.example .env.local

# Edit and add your keys:
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

## 5. Run Locally (1 min)

```bash
npm run dev
# Open http://localhost:3000
```

## 6. Test Workflow (2 min)

### As Seller:
1. Sign up at `/auth/signup`
2. Go to `/seller/dashboard`
3. List a test product

### As Buyer:
1. Create different account
2. Go to `/shop/products`
3. Find product and add to cart
4. Go to checkout

## 🎉 Done!

You now have a working marketplace locally. To deploy to production:
1. See `DEPLOYMENT.md` for step-by-step guide
2. Takes about 30 minutes total

## Test Cards

In Stripe test mode, use:
- Card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., 12/26)
- CVC: Any 3 digits (e.g., 123)

## Common Issues

**"Cannot find module '@supabase/supabase-js'"**
```bash
npm install
```

**"Database connection error"**
- Check Supabase URL and keys are correct
- Verify migrations were run
- Check project is active in Supabase

**"Stripe not working"**
- Use test keys, not production
- Check key format (pk_test_ for public, sk_test_ for secret)

## Next Steps

1. Customize branding (update colors, logo)
2. Add more product categories
3. Deploy to Vercel (DEPLOYMENT.md)
4. Add legal pages (Terms, Privacy)
5. Set up email notifications

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- Full README: `README.md`
- Deployment Guide: `DEPLOYMENT.md`

---

**Questions?** Check the README or DEPLOYMENT guide for more details.

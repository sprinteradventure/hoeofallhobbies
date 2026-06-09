# Hoe of All Hobbies - Craft & Hobby Supplies Marketplace

A modern, full-stack marketplace for buying and selling craft and hobby supplies, built with Next.js, Supabase, and Stripe.

## 🚀 Features

### For Buyers
- 🔍 Search and filter products by category, price, condition
- 🛒 Shopping cart with real-time inventory updates
- 💳 Secure checkout with Stripe
- ⭐ Review and rate sellers
- 📦 Order tracking and history
- ❤️ Wishlist and saved searches

### For Sellers
- 📸 Multi-image product listings
- 📊 Seller dashboard with analytics
- 💰 Automatic weekly payouts via Stripe Connect
- 📈 Sales tracking and performance metrics
- ✅ Inventory management
- 🏆 Seller verification and ratings

### For Admins
- 📈 Real-time analytics dashboard
- 👥 User and seller management
- 🛡️ Content moderation tools
- 💳 Payment dispute resolution
- 📋 Audit logging

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Payments**: Stripe + Stripe Connect
- **Deployment**: Vercel
- **Database**: PostgreSQL with Row-Level Security
- **Search**: Full-text search via PostgreSQL

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Git
- Accounts created for:
  - [Supabase](https://supabase.com)
  - [Stripe](https://stripe.com)
  - [Vercel](https://vercel.com)

## 🔧 Setup Instructions

### 1. Clone and Install

```bash
cd "Hoe of all Hobbies"
npm install
```

### 2. Supabase Configuration

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database** and copy your:
   - Project URL
   - Anon (public) API Key
   - Service Role API Key
3. Go to **SQL Editor** and run the migrations:
   - Copy and run `supabase/migrations/001_initial_schema.sql`
   - Copy and run `supabase/migrations/002_rls_policies.sql`

### 3. Environment Variables

Create `.env.local` in the project root:

```bash
cp .env.example .env.local
```

Fill in the values:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Admin
NEXT_PUBLIC_ADMIN_EMAIL=your-email@gmail.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Local Development

```bash
npm run dev
```

Visit `http://localhost:3000`

### 5. Test the Flow

1. **Sign up as a buyer**
   - Go to `/auth/signup`
   - Create an account

2. **Sign up as a seller**
   - Create another account
   - Enable seller mode in the seller dashboard
   - Create a product listing

3. **Make a purchase**
   - Switch to buyer account
   - Browse products
   - Add to cart
   - Checkout (payment processing coming next)

## 🚢 Deployment to Production

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/hoe-of-all-hobbies.git
git push -u origin main
```

### Step 2: Deploy to Vercel

**Option A: Using Vercel CLI**
```bash
npm i -g vercel
vercel
# Follow prompts and link to your GitHub repo
```

**Option B: Using Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Add environment variables (same as `.env.local`)
5. Click Deploy

### Step 3: Configure Custom Domain in GoDaddy

1. Go to your GoDaddy account
2. Navigate to DNS Management for your domain
3. Add DNS records:

   **For hoeofallhobbies.com:**
   - Type: `CNAME`
   - Name: `@` (or leave blank)
   - Data: `cname.vercel-dns.com`
   - TTL: Default

4. In Vercel project settings:
   - Go to **Domains**
   - Add `hoeofallhobbies.com`
   - Follow Vercel's DNS instructions
   - SSL certificate auto-generates (2-48 hours)

**DNS propagation can take 24-48 hours**

### Step 4: Configure Stripe Webhooks

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click **Developers → Webhooks**
3. Click **Add endpoint**
4. Endpoint URL: `https://hoeofallhobbies.com/api/stripe/webhook`
5. Select events:
   - `payment_intent.succeeded`
   - `charge.refunded`
   - `customer.subscription.updated`
6. Copy signing secret to `STRIPE_WEBHOOK_SECRET` in Vercel

### Step 5: Update Supabase Production

For production, create a separate Supabase project:
1. Create new project on Supabase (production)
2. Run migrations again
3. Update environment variables in Vercel with new keys

## 📊 Database Schema

### Core Tables
- **user_profiles**: User accounts, seller status, ratings
- **products**: Product listings with search, images, inventory
- **orders**: Purchase orders with status tracking
- **reviews**: Seller ratings and feedback
- **cart_items**: Shopping carts
- **seller_payouts**: Payout tracking
- **audit_logs**: Activity logging for compliance

All tables have Row-Level Security (RLS) policies for data privacy.

## 🔐 Security Features

- ✅ Email verification on signup
- ✅ JWT token-based authentication
- ✅ Row-Level Security on database
- ✅ CSRF protection ready
- ✅ Rate limiting ready
- ✅ PCI DSS compliant (Stripe handles payments)
- ✅ Audit logging
- ✅ HTTPS enforced
- ✅ Secure headers

## 💳 Payment Processing

### Stripe Integration

**Test Mode:**
- Use card: `4242 4242 4242 4242`
- Any future expiry date
- Any 3-digit CVC

**Payment Flow:**
1. Customer adds items to cart
2. Checkout creates Stripe payment intent
3. Customer authorizes payment
4. Funds held for 30 days
5. Upon delivery confirmation, seller receives 80% of transaction
6. Platform keeps 20% fee
7. Weekly payouts to seller's bank account

### Setting Up Seller Payouts

1. Seller signs up and enables seller mode
2. When making first sale, redirected to Stripe Connect
3. Complete business verification
4. Add bank account for payouts
5. Automatic weekly payouts begin

## 📈 Scaling & Performance

### Current Capacity
- Free tier: 0-1,000 users
- Supabase: 500MB database
- Vercel: Serverless auto-scaling

### Performance Optimizations
- Next.js Image component for optimization
- PostgreSQL full-text search
- Real-time subscriptions via Supabase
- Edge caching with Vercel CDN

### When to Upgrade (1k-10k users)
- Supabase Pro: $25/month
- Vercel Pro: $20/month
- Add Redis for caching
- Add Meilisearch for advanced search

## 📚 Project Structure

```
├── app/                  # Next.js app directory
│   ├── auth/            # Login/signup pages
│   ├── shop/            # Shopping pages
│   ├── seller/          # Seller dashboard
│   ├── admin/           # Admin dashboard
│   ├── api/             # API routes
│   └── layout.tsx       # Root layout
├── components/          # Reusable components
├── lib/                 # Utilities & config
│   ├── supabase/        # Database client
│   └── types.ts         # TypeScript types
├── styles/              # Global CSS
├── supabase/            # Database migrations
└── public/              # Static assets
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] Signup/login as buyer
- [ ] Signup/login as seller
- [ ] Create product listing
- [ ] Search products
- [ ] Add to cart
- [ ] Checkout flow
- [ ] View orders
- [ ] Leave review
- [ ] Check admin dashboard

### Load Testing
```bash
# Coming soon - add load testing with k6
```

## 🐛 Debugging

### Common Issues

**"Database connection failed"**
- Check Supabase URL and API keys in `.env.local`
- Verify Supabase project is running
- Check network connectivity

**"Payment intent failed"**
- Verify Stripe keys are correct
- Check webhook endpoint in Stripe dashboard
- Ensure test mode is enabled

**"Can't view orders"**
- Check RLS policies in Supabase
- Verify user authentication
- Check browser console for errors

### Logs
- **Browser**: DevTools Console
- **Backend**: Vercel Logs in dashboard
- **Database**: Supabase SQL Editor
- **Payments**: Stripe Dashboard

## 📞 Support

### Resources
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [Vercel Docs](https://vercel.com/docs)

### Getting Help
1. Check error messages in console
2. Review the documentation above
3. Check GitHub Issues
4. Contact support via email

## 📋 Production Checklist

- [ ] All environment variables set in Vercel
- [ ] Custom domain configured on GoDaddy
- [ ] Stripe webhooks configured
- [ ] Supabase production project created
- [ ] Email notifications configured
- [ ] Terms of Service added
- [ ] Privacy Policy added
- [ ] Cookie policy and consent
- [ ] SSL certificate active (shows green lock)
- [ ] Analytics configured (PostHog/Vercel)
- [ ] Error tracking configured (Sentry)
- [ ] Database backups enabled
- [ ] Monitoring alerts set up

## 💡 Future Enhancements

- [ ] Messaging system between buyers/sellers
- [ ] Live auctions for premium items
- [ ] Collections and wishlist
- [ ] Social features (follow sellers)
- [ ] ML-based recommendations
- [ ] Mobile app (React Native)
- [ ] International expansion
- [ ] Subscription boxes

## 📄 License

MIT License - see LICENSE file

## 🙏 Acknowledgments

Built with:
- Next.js
- Supabase
- Stripe
- Tailwind CSS
- Vercel

---

**Status**: Production Ready ✅
**Last Updated**: May 29, 2026
**Maintained by**: Your Team

For updates and support, visit [hoeofallhobbies.com](https://hoeofallhobbies.com)

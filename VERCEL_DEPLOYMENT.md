# Vercel Deployment Guide

This document provides specific instructions for deploying Hoe of All Hobbies to Vercel.

## Prerequisites

- GitHub repository connected
- Vercel account (vercel.com)
- Supabase project already configured

## Deployment Steps

### 1. Connect to Vercel

Option A (Recommended): Import from GitHub
- Go to vercel.com/new
- Select "Import an existing project"
- Choose your GitHub repository
- Vercel will auto-detect Next.js

Option B: Deploy CLI
```bash
npm install -g vercel
vercel
```

### 2. Add Environment Variables

In Vercel Project Settings > Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
MIGRATION_SECRET_KEY=your-secure-migration-key
```

**Important**: 
- Keep keys secure - use environment variables, never commit to git
- Service role key should only be in server-side code or environment variables
- NEXT_PUBLIC_* variables will be visible in browser (use only for public keys)

### 3. Configure Build Settings

Vercel auto-detects Next.js. Default settings should work:
- **Build Command**: `next build`
- **Output Directory**: `.next`
- **Development Command**: `next dev`

### 4. First Deployment

After connecting and adding environment variables:

1. Click "Deploy"
2. Wait for build to complete (first build takes ~3-5 minutes)
3. Check build logs if issues occur

### 5. Run Database Migrations

Once deployed:

1. Get your Vercel deployment URL
2. Make a POST request to `{your-url}/api/migrations`
   
   Using curl:
   ```bash
   curl -X POST https://your-deployment.vercel.app/api/migrations \
     -H "Authorization: Bearer your-migration-secret-key"
   ```

   Or use a tool like Postman:
   - Method: POST
   - URL: `https://your-deployment.vercel.app/api/migrations`
   - Headers: 
     - Authorization: `Bearer your-migration-secret-key`

### 6. Test Your Deployment

1. Visit your Vercel deployment URL
2. Test key features:
   - Homepage loads
   - Can navigate to products
   - Can sign up / login
   - Can create seller listing (as authenticated user)
   - Can add items to cart
   - Can checkout (orders in pending status)

## Troubleshooting

### Build Fails
Check the deployment logs in Vercel dashboard:
- Click on failed deployment
- View "Build Logs" tab
- Common issues:
  - Missing environment variables
  - TypeScript compilation errors
  - Missing dependencies

**Solution**: Fix the error locally, commit, and push to trigger rebuild.

### Environment Variables Not Working
- Clear Vercel build cache: Project Settings > Git > Clear Cache
- Redeploy
- Verify variable names match code references

### Database Connection Failed
1. Test Supabase connection locally
2. Verify `NEXT_PUBLIC_SUPABASE_URL` and keys are correct
3. Check Supabase network access allows Vercel IPs
4. In Supabase, confirm JWT secret is set

### Migrations Not Running
1. Verify migration secret key matches environment variable
2. Check `Authorization` header format: `Bearer {key}`
3. Look at response for detailed error message
4. Ensure Supabase service role key has database access

### 404 on Routes
Vercel should auto-handle Next.js routing. If getting 404:
1. Check page file exists at correct path
2. Verify no typos in route paths
3. Rebuild and redeploy

## Performance Tips

1. **Image Optimization**: Add image optimization in next.config.ts if serving images
2. **Caching**: Vercel auto-caches static assets
3. **Functions**: API routes auto-scale as serverless functions
4. **Database**: Use Supabase connection pooling for production

## Security Checklist

- [ ] Service role key only in environment variables (not in code)
- [ ] RLS policies enabled on all Supabase tables
- [ ] CORS configured if frontend at different domain
- [ ] Environment variables set for all secrets
- [ ] Migration endpoint protected with secret key
- [ ] Email verification configured in Supabase
- [ ] Rate limiting considered for API endpoints

## Monitoring

In Vercel Dashboard:
- **Analytics Tab**: View traffic, performance metrics
- **Functions Tab**: Monitor API route performance
- **Deployment Tab**: View deployment history and rollback
- **Logs**: Real-time function logs

## Custom Domain

1. Go to Project Settings > Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_APP_URL` to your domain
5. Redeploy

## Rollback

If something breaks:
1. Go to Deployments tab
2. Click the previous working deployment
3. Click "Promote to Production"

## Development vs Production

- **Development**: `npm run dev` (localhost:3000)
- **Preview**: Vercel auto-creates for pull requests
- **Production**: main branch deployment

## Next Steps

1. Deploy to Vercel following steps above
2. Test all features work
3. Set up custom domain if needed
4. Configure error monitoring (Sentry, etc.)
5. Set up analytics (built-in Vercel analytics available)
6. Implement remaining Stripe integration
7. Configure email service for notifications

## Getting Help

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs
- Project Issues: Check GitHub issues for known problems

---

**Good luck with your deployment!** 🚀

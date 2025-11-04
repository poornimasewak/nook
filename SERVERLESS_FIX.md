# 🚀 Serverless Deployment Fix for Login

## The Problem

Your login was failing on the deployed version because the OTP storage used **in-memory Maps** which don't work in serverless environments (Vercel, Netlify, etc.). Each API request gets a fresh instance, so the stored OTP is lost.

## The Solution

I've created a **serverless-compatible** OTP storage system using Supabase.

## Files Modified/Created

### ✅ Created
- `lib/auth-serverless.ts` - New serverless-compatible auth functions
- `supabase/migrations/003_create_email_otps_table.sql` - Database table for OTP storage
- `SERVERLESS_FIX.md` - This guide

### ✅ Modified
- `pages/api/auth/send-email-otp.ts` - Now uses serverless auth
- `pages/api/auth/verify-email-otp.ts` - Now uses serverless auth

## Deployment Steps

### 1. **Run the Supabase Migration**

You need to create the `email_otps` table in your Supabase database.

**Option A: Using Supabase Dashboard (Easiest)**
1. Go to https://app.supabase.com
2. Open your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the contents of `supabase/migrations/003_create_email_otps_table.sql`
6. Paste into the editor
7. Click **Run**
8. ✅ Table created!

**Option B: Using Supabase CLI**
```bash
# If you have Supabase CLI installed
supabase db push
```

### 2. **Set Environment Variables on Vercel**

Your deployment needs these environment variables:

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these variables:

```env
# Required for login to work
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production-67890

# Supabase (required for OTP storage)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Optional - for production socket.io
NEXT_PUBLIC_SOCKET_URL=wss://your-socket-server.com
```

**Where to find Supabase keys:**
1. Go to https://app.supabase.com
2. Open your project
3. Click **Settings** (gear icon) → **API**
4. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Secret - never expose!)

### 3. **Deploy**

```bash
# Commit and push your changes
git add .
git commit -m "Fix: Serverless-compatible OTP storage"
git push

# Vercel will auto-deploy
```

Or manually deploy:
```bash
vercel --prod
```

### 4. **Test Your Login**

1. Go to your deployed site: `https://your-app.vercel.app/login`
2. Enter name and email
3. Click "Verify for your cozy nook"
4. Check for the OTP:
   - **Option A**: Check your email (if you configured an email service)
   - **Option B**: Check Vercel logs:
     - Go to Vercel dashboard → Your project → **Logs**
     - Look for: `📧 OTP for your-email@example.com: 123456`

5. Enter the OTP on the verification page
6. ✅ Should redirect to `/nook` upon success!

## How It Works Now

### Before (Broken in Serverless):
```
Request 1: /api/auth/send-email-otp
  → Stores OTP in memory Map
  → Map exists only for this request

Request 2: /api/auth/verify-email-otp
  → Runs in NEW serverless instance
  → Map is empty ❌
  → OTP not found
```

### After (Works in Serverless):
```
Request 1: /api/auth/send-email-otp
  → Stores OTP in Supabase database
  → Persists across requests ✅

Request 2: /api/auth/verify-email-otp
  → Reads OTP from Supabase
  → Finds OTP ✅
  → Verifies and logs user in
```

## Troubleshooting

### Issue: "OTP storage failed. Please configure Supabase."

**Solution**: Set Supabase environment variables (see step 2 above)

### Issue: "Invalid or expired OTP"

**Possible causes:**
1. OTP expired (5 minute timeout)
2. Supabase table not created (run migration from step 1)
3. Wrong OTP entered

**Check Vercel logs:**
- Vercel dashboard → Logs
- Look for errors or the OTP code

### Issue: Still seeing LastPass errors in console

**This is normal!** Those errors are from your browser extension, not your app.

**To filter them out:**
- In DevTools Console, type: `-chrome-extension: -injectedMethod`

### Issue: API route returns 500 error

**Check:**
1. Environment variables are set on Vercel
2. Supabase table was created successfully
3. Vercel logs for specific error messages

## Testing Locally

Before deploying, test locally:

```bash
# 1. Copy env.example to .env.local
cp env.example .env.local

# 2. Fill in your Supabase credentials in .env.local

# 3. Run the migration in Supabase dashboard

# 4. Start dev server
npm run dev

# 5. Test login at http://localhost:3000/login
```

## Next Steps (Optional)

### Add Email Service (Production-Ready)

Currently, OTPs are only logged to console. To send real emails:

1. **Install email package:**
```bash
npm install @sendgrid/mail
# or
npm install nodemailer
```

2. **Update `lib/email-otp.ts`** with your email service configuration

3. **Add API keys to Vercel:**
```env
SENDGRID_API_KEY=your-sendgrid-api-key
# or
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Add Redis for Faster OTP Storage (Advanced)

For higher performance, use Vercel KV (Redis):
- https://vercel.com/docs/storage/vercel-kv

## Summary

✅ **Fixed**: OTP storage now works in serverless environments
✅ **Created**: Supabase table for persistent OTP storage  
✅ **Updated**: API routes to use serverless-compatible functions
✅ **Next**: Run migration, set env vars, deploy!

Your login should work perfectly on Vercel now! 🎉


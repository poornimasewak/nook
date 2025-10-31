# Quick Setup Instructions 🚀

## The Error You're Seeing

```
Error: supabaseUrl is required.
```

This happens because Supabase credentials are not configured yet.

## Quick Fix (2 Options)

### Option 1: Use Without Database (Development Only)

The `.env.local` file has been created. For development/testing without setting up Supabase:

**The app will now start and OTP will work in development mode** (logged to console).

No database setup needed for initial testing!

---

### Option 2: Set Up Supabase (Recommended for Full Features)

#### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" → Sign up/Login
3. Click "New Project"
4. Choose organization and fill details
5. Wait ~2 minutes for setup

#### Step 2: Get Your Credentials

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy:
   - **Project URL** (example: `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (keep this secret!)

#### Step 3: Update `.env.local`

Open `.env.local` and replace:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Step 4: Create Database Tables

1. In Supabase dashboard → **SQL Editor**
2. Click "New Query"
3. Copy entire contents of `database/schema.sql`
4. Paste and click "Run"
5. Wait for success message ✅

#### Step 5: Restart Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## What Works Right Now

### Without Supabase Setup:
✅ Login page UI
✅ OTP generation
✅ OTP console logging
✅ OTP verification UI
❌ User creation (needs database)
❌ Token storage (needs database)

### With Supabase Setup:
✅ Everything above +
✅ Full user authentication
✅ User database
✅ Token management
✅ Complete authentication flow

---

## Test Login Flow (Without Database)

```bash
# 1. Start server
npm run dev

# 2. Visit
http://localhost:3000/login

# 3. Enter any phone number
Select country code → Enter 10 digits → Click "Continue"

# 4. Check terminal
You'll see:
============================================================
📱 OTP for +1234567890: 123456
⏰ This code expires in 5 minutes
============================================================

# 5. Enter OTP in browser
Type 123456 → Click "Verify"

# 6. It will attempt to save to database
If no Supabase: Will show error (but OTP works!)
If Supabase configured: Will succeed!
```

---

## Next Steps

1. ✅ **Test the UI** (works now!)
2. 🗄️ **Set up Supabase** (when ready for full features)
3. 📱 **Configure Twilio** (optional, for SMS)

---

## Need Help?

- **See**: `README.md` for full documentation
- **See**: `SETUP.md` for detailed setup
- **See**: `QUICKSTART.md` for quick start
- **See**: `TWILIO_SETUP.md` for SMS setup

---

## Current Status

The application will start and you can:
- ✅ See the beautiful login page
- ✅ Enter phone numbers
- ✅ Get OTP codes in console
- ✅ Test the UI/UX

Once you set up Supabase, everything will work end-to-end!

**Start the server and test it now!** 🎉



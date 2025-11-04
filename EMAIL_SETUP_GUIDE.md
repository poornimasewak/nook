# 📧 Email OTP Setup Guide

## Current State: Console Logging Only

Right now, OTPs are only logged to the console:
- **Localhost**: Shows in your terminal
- **Production (Vercel)**: Shows in Vercel Function Logs

For real users, you need to send OTPs via email.

---

## 🚀 Setup Email Sending (Choose One)

### ⭐ Option 1: Resend (Recommended - Easiest)

**Why Resend?**
- ✅ Modern, simple API
- ✅ Free tier: 3,000 emails/month
- ✅ No credit card required
- ✅ Great deliverability
- ✅ Beautiful email templates

#### Setup Steps:

1. **Sign up at Resend:**
   - Go to https://resend.com
   - Click "Sign Up" (free)
   - Verify your email

2. **Get API Key:**
   - Dashboard → API Keys
   - Click "Create API Key"
   - Copy the key (starts with `re_`)

3. **Add to Environment Variables:**
   
   **Local (.env.local):**
   ```env
   RESEND_API_KEY=re_your_api_key_here
   ```

   **Vercel (Production):**
   - Go to Vercel → Settings → Environment Variables
   - Add: `RESEND_API_KEY` = `re_your_api_key_here`

4. **Update the email service file:**
   ```bash
   # Rename the file
   mv lib/email-otp.ts lib/email-otp-backup.ts
   mv lib/email-otp-resend.ts lib/email-otp.ts
   ```

5. **Deploy:**
   ```bash
   git add .
   git commit -m "Add Resend email service"
   git push
   ```

6. **Test:**
   - Go to your deployed site
   - Try logging in with your real email
   - You should receive the OTP via email! 🎉

#### Domain Setup (Optional but Recommended):

By default, emails come from `onboarding@resend.dev`. To use your own domain:

1. Go to Resend Dashboard → Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `nook.com`)
4. Add DNS records (provided by Resend)
5. Wait for verification
6. Update `from` field in `lib/email-otp.ts`:
   ```typescript
   from: 'Nook <noreply@yourdomain.com>',
   ```

---

### Option 2: SendGrid (Popular, Reliable)

**Why SendGrid?**
- ✅ Industry standard
- ✅ Free tier: 100 emails/day
- ✅ Advanced analytics
- ✅ Good documentation

#### Setup Steps:

1. **Sign up:**
   - Go to https://sendgrid.com
   - Sign up for free account

2. **Create API Key:**
   - Settings → API Keys → Create API Key
   - Give it "Full Access" or "Mail Send" permissions
   - Copy the key (starts with `SG.`)

3. **Install package:**
   ```bash
   npm install @sendgrid/mail
   ```

4. **Create email service:**
   ```typescript
   // lib/email-otp.ts
   import sgMail from '@sendgrid/mail';

   sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

   export async function sendEmailOTP(email: string, otp: string, fullName: string): Promise<boolean> {
       try {
           await sgMail.send({
               to: email,
               from: 'noreply@yourdomain.com', // Must be verified in SendGrid
               subject: 'Your Nook Verification Code',
               html: `<h1>Your OTP is: ${otp}</h1>`,
           });
           return true;
       } catch (error) {
           console.error('SendGrid error:', error);
           return false;
       }
   }
   ```

5. **Add environment variable:**
   ```env
   SENDGRID_API_KEY=SG.your_api_key_here
   ```

---

### Option 3: Nodemailer with Gmail (Free, DIY)

**Why Nodemailer?**
- ✅ Completely free
- ✅ Use your Gmail account
- ✅ Full control

#### Setup Steps:

1. **Enable Gmail App Password:**
   - Go to https://myaccount.google.com/security
   - Turn on 2-Step Verification (if not already)
   - Go to "App passwords"
   - Generate app password for "Mail"
   - Copy the 16-character password

2. **Install package:**
   ```bash
   npm install nodemailer
   npm install --save-dev @types/nodemailer
   ```

3. **Create email service:**
   ```typescript
   // lib/email-otp.ts
   import nodemailer from 'nodemailer';

   export async function sendEmailOTP(email: string, otp: string, fullName: string): Promise<boolean> {
       const transporter = nodemailer.createTransport({
           service: 'gmail',
           auth: {
               user: process.env.GMAIL_USER,
               pass: process.env.GMAIL_APP_PASSWORD,
           },
       });

       try {
           await transporter.sendMail({
               from: `"Nook" <${process.env.GMAIL_USER}>`,
               to: email,
               subject: 'Your Nook Verification Code',
               html: `
                   <h2>Hello ${fullName}!</h2>
                   <p>Your verification code is: <strong style="font-size: 24px;">${otp}</strong></p>
                   <p>This code expires in 5 minutes.</p>
               `,
           });
           return true;
       } catch (error) {
           console.error('Nodemailer error:', error);
           return false;
       }
   }
   ```

4. **Add environment variables:**
   ```env
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-char-app-password
   ```

---

## 📝 Quick Comparison

| Service | Free Tier | Setup Time | Deliverability | Best For |
|---------|-----------|------------|----------------|----------|
| **Resend** | 3,000/month | 5 min | ⭐⭐⭐⭐⭐ | New apps, easy setup |
| **SendGrid** | 100/day | 10 min | ⭐⭐⭐⭐⭐ | Established apps |
| **Nodemailer** | Unlimited | 15 min | ⭐⭐⭐ | Personal projects |

---

## 🧪 Testing Email Delivery

### Test Locally:

1. Add API key to `.env.local`
2. Start dev server: `npm run dev`
3. Go to `http://localhost:3000/login`
4. Enter your real email
5. Check your inbox for OTP email

### Test on Vercel:

1. Add API key to Vercel environment variables
2. Deploy
3. Go to your production URL
4. Try logging in with real email
5. Check inbox

---

## 🔍 Troubleshooting

### "Email not received"

1. **Check spam folder**
2. **Verify API key is set** in environment variables
3. **Check Vercel logs** for errors:
   - Vercel Dashboard → Logs
   - Look for "Email sent" or error messages
4. **Verify sender domain** (for SendGrid/production)

### "API key not working"

- Make sure there are no spaces before/after the key
- Redeploy after adding environment variables
- Check the key hasn't expired

### "Emails going to spam"

- Use a verified domain (not default)
- Add SPF, DKIM, DMARC records
- Don't send too many emails too quickly

---

## 🎯 Recommended Setup for Your App

**For MVP/Testing:** Use **Resend** with default domain
- ✅ Quick setup
- ✅ No domain verification needed
- ✅ Good deliverability

**For Production:** Use **Resend** with your own domain
- ✅ Professional emails
- ✅ Better deliverability
- ✅ Brand consistency

---

## 📦 What's Already Configured

Your app is already set up to:
- ✅ Generate 6-digit OTPs
- ✅ Store them in Supabase
- ✅ Send them via `lib/email-otp.ts`
- ✅ Log them to console as fallback
- ✅ Show OTP in Vercel logs

**You just need to add an email service!**

---

## 🚀 Quick Start (Resend - 5 minutes)

```bash
# 1. Sign up at resend.com and get API key

# 2. Add to .env.local
echo "RESEND_API_KEY=re_your_key_here" >> .env.local

# 3. Replace email service
mv lib/email-otp.ts lib/email-otp-backup.ts
mv lib/email-otp-resend.ts lib/email-otp.ts

# 4. Add to Vercel
# Go to Vercel → Settings → Environment Variables
# Add: RESEND_API_KEY=re_your_key_here

# 5. Deploy
git add .
git commit -m "Add Resend email service"
git push

# 6. Test at your deployed URL!
```

Done! 🎉


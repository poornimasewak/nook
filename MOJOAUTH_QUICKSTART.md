# MojoAuth Email Login - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Get Your MojoAuth API Key (Optional)

MojoAuth integration is **optional**. The system works with a fallback API, but for production, follow these steps:

1. Visit [https://mojoauth.com](https://mojoauth.com)
2. Sign up for a free account
3. Create a new project
4. Copy your API key from the dashboard

### Step 2: Configure Environment (Optional)

Create a `.env.local` file in your project root:

```bash
# MojoAuth (Optional - has fallback)
NEXT_PUBLIC_MOJOAUTH_API_KEY=your-mojoauth-api-key-here

# Required for JWT tokens
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
```

If you don't set `NEXT_PUBLIC_MOJOAUTH_API_KEY`, the system will use the custom fallback API automatically.

### Step 3: Test the Login

1. Start the dev server:
```bash
npm run dev
```

2. Visit `http://localhost:3000/login`

3. Enter your name and email

4. Click **"Verify for your cozy nook"**

5. Check your terminal for the OTP code:
```
======================================================================
📧 EMAIL OTP VERIFICATION
======================================================================
To: yourname@example.com
Name: Your Name
OTP Code: 123456
Expires in: 5 minutes
======================================================================
```

6. Enter the OTP on the verification page

7. You're logged in! 🎉

## 🎨 What You Get

### Beautiful Login Page
- Gradient background (cyan → teal → orange)
- Clean, modern design
- Smooth animations
- Mobile responsive

### Features
- ✅ Email OTP verification
- ✅ Full name collection
- ✅ Error validation with visual indicators
- ✅ Automatic OTP expiration (5 minutes)
- ✅ Resend OTP functionality
- ✅ JWT token authentication
- ✅ Works with or without MojoAuth

## 🔧 Development vs Production

### Development Mode (Current)
- OTP printed to console
- No email service required
- Perfect for testing

### Production Mode (When Ready)
You need to configure an email service. Options:

#### Option 1: SendGrid (Recommended)
```bash
npm install @sendgrid/mail
```

Add to `.env.local`:
```bash
SENDGRID_API_KEY=your-sendgrid-api-key
```

Uncomment SendGrid code in `lib/email-otp.ts`

#### Option 2: Nodemailer (SMTP)
```bash
npm install nodemailer
```

Add to `.env.local`:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

Uncomment Nodemailer code in `lib/email-otp.ts`

#### Option 3: AWS SES
Configure AWS credentials and use AWS SES SDK.

## 📱 Testing Flow

1. **Visit Login**: `http://localhost:3000/login`
2. **Enter Details**:
   - Full Name: John Doe
   - Email: john@example.com
3. **Submit**: Click verify button
4. **Get OTP**: Check terminal console
5. **Verify**: Enter 6-digit OTP
6. **Success**: Redirected to dashboard

## 🐛 Troubleshooting

### Can't see OTP?
- Check your terminal where `npm run dev` is running
- Look for the email OTP section with your OTP code

### Getting validation errors?
- Both Full Name and Email are required
- Email must be in valid format (name@domain.com)
- If you see a red badge on Full Name, fill it in

### MojoAuth not working?
- Don't worry! The fallback API works automatically
- Check browser console for any errors
- Verify API key if you set one

## 🎯 Next Steps

1. ✅ Login page with email OTP - **DONE**
2. Configure email service for production
3. Set up user profile page
4. Create dashboard
5. Add profile picture upload
6. Integrate with your existing Nook features

## 📚 Documentation

- **Full Documentation**: See `EMAIL_LOGIN_MOJOAUTH.md`
- **API Reference**: Check API endpoint details in full docs
- **Customization**: Learn how to customize colors, timeouts, etc.

## 🌟 Features Included

- Beautiful gradient login page
- Email OTP verification
- MojoAuth integration with fallback
- Error handling with visual indicators
- Resend OTP functionality
- JWT token generation
- User creation/login
- Mobile responsive design
- Console logging for development

## ⚡ Quick Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🎨 Access Pages

- **Login**: `http://localhost:3000/login`
- **Chat Room**: `http://localhost:3000/chatroom`
- **Home**: `http://localhost:3000`

---

**That's it!** Your email login with OTP is ready to use. No complex setup required for development. When you're ready for production, just configure an email service and deploy! 🚀



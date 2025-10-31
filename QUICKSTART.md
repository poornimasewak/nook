# Nook Quick Start Guide 🚀

Get your Nook backend up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free)
- A Twilio account (for SMS OTP)
- Git installed

## Quick Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd nook
npm install
```

### 2. Environment Setup

Create `.env.local` in the root directory:

```env
# Get these from Supabase Dashboard
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# Generate random strings (use: openssl rand -hex 32)
JWT_SECRET=your-random-secret-min-32-chars
JWT_REFRESH_SECRET=your-random-secret-min-32-chars

# Get these from Twilio Dashboard
TWILIO_ACCOUNT_SID=xxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1234567890

# Storage
SUPABASE_STORAGE_BUCKET=nook-files

# Development
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=Nook
```

### 3. Supabase Database Setup

1. Go to [supabase.com](https://supabase.com) and create a project
2. Wait for database to initialize
3. Go to SQL Editor
4. Copy contents of `database/schema.sql`
5. Paste and run in SQL Editor
6. Go to Storage → Create bucket `nook-files` (public access)

### 4. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000 to see the welcome page!

### 5. Test API

#### Send OTP (Development Mode)
```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'
```

Check the terminal console for the OTP code (only in development).

#### Verify OTP
```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890", 
    "otp": "123456", 
    "name": "Test User"
  }'
```

Copy the `token` from the response for authenticated requests.

#### Get Your Profile
```bash
curl http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## What's Working

✅ All authentication endpoints  
✅ User profile management  
✅ User search and invitations  
✅ Nook creation and management  
✅ Nook member management  
✅ Messages retrieval  
✅ Beautiful welcome page  
✅ Production-ready backend  

## What's Next

📱 **Mobile App Development**
- The mobile app is a separate project
- Use React Native with Expo
- See detailed specs in the main prompt

🔌 **Real-time Messaging**
- Implement Socket.io server for WebSockets
- Currently messages are stored but not real-time

👥 **Friends System**
- Implement friend request endpoints
- Build friend list and DMs

## Common Issues

### Issue: Supabase connection error
**Solution:** Double-check your Supabase URL and keys in `.env.local`

### Issue: OTP not sending
**Solution:** In development, OTP is logged to console. For production, configure Twilio credentials.

### Issue: Build errors
**Solution:** Make sure all dependencies are installed: `npm install`

### Issue: Port already in use
**Solution:** Change port: `PORT=3001 npm run dev`

## Production Deployment

### Vercel

1. Push code to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

The `vercel.json` is already configured!

## Documentation

- **README.md** - Full project documentation
- **SETUP.md** - Detailed setup instructions
- **API.md** - Complete API reference
- **PROJECT_STATUS.md** - Current status and roadmap

## Need Help?

- Check API.md for endpoint details
- See SETUP.md for troubleshooting
- Review PROJECT_STATUS.md for roadmap

## Quick Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Project Structure

```
nook/
├── app/              # Next.js app directory (landing page)
├── pages/api/        # API routes
├── lib/              # Utilities (auth, supabase, etc.)
├── database/         # SQL schema
├── public/           # Static assets
└── .env.local        # Environment variables (create this)
```

## Features Overview

### Completed ✅
- OTP authentication
- User management
- Nook CRUD operations
- Member management
- Message storage
- Admin controls
- Profile management

### Planned 📋
- Socket.io real-time
- Mobile app
- Friends system
- Push notifications
- File uploads
- Message reactions

---

**Ready to build something cozy!** 🏠💬

For detailed information, check the other documentation files.




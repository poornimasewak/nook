# Nook Setup Guide 🏠

This guide will help you set up the Nook chat application from scratch.

## Prerequisites

Before you begin, make sure you have:
- Node.js 18+ installed
- A Supabase account (free tier is fine)
- A Twilio account (for SMS OTP functionality)
- Git installed
- A code editor (VS Code recommended)

## Step 1: Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd nook

# Install dependencies
npm install
```

## Step 2: Set Up Supabase

1. Go to [Supabase](https://supabase.com) and create a new project
2. Note down your project URL and API keys
3. Go to the SQL Editor in your Supabase dashboard
4. Copy and paste the contents of `database/schema.sql`
5. Run the SQL script to create all tables
6. Go to Storage and create a new bucket named `nook-files` with public access

## Step 3: Set Up Twilio

1. Go to [Twilio](https://twilio.com) and sign up
2. Get your Account SID and Auth Token from the dashboard
3. Get a phone number (free trial phone numbers are available)

## Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env.local`
2. Fill in all the required values:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT (Generate random strings)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-chars

# Twilio
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Supabase Storage
SUPABASE_STORAGE_BUCKET=nook-files

# Socket.io
SOCKET_PORT=3001

# App Config
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=Nook
```

## Step 5: Start Development Server

```bash
npm run dev
```

The backend should now be running on `http://localhost:3000`

## Step 6: Test the API

You can test the API using curl or Postman:

```bash
# Send OTP
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'

# Verify OTP (check console for OTP in development)
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890", "otp": "123456", "name": "Test User"}'
```

## Step 7: Set Up Mobile App (Separate Project)

The mobile app is a separate React Native project. To set it up:

```bash
# Create the mobile app directory
mkdir mobile
cd mobile

# Initialize Expo project
npx create-expo-app . --template blank-typescript

# Install dependencies
npm install @react-navigation/native @react-navigation/bottom-tabs \
  nativewind tailwindcss react-native-safe-area-context \
  socket.io-client @supabase/supabase-js @react-native-async-storage/async-storage

# Follow Expo setup instructions
```

See the main README for complete mobile setup instructions.

## Troubleshooting

### Issue: Supabase connection errors
- Make sure your Supabase URL and keys are correct
- Check that you've run the SQL schema script
- Verify RLS policies if you're using authentication

### Issue: Twilio not sending SMS
- Check your Twilio credentials
- Verify your phone number is verified in Twilio
- In development, OTPs are logged to console instead

### Issue: JWT errors
- Make sure JWT secrets are at least 32 characters
- Don't use default secrets in production

### Issue: Socket.io not connecting
- Check that port 3001 is not in use
- Update NEXT_PUBLIC_SOCKET_URL if running on different port

## Next Steps

1. Set up the mobile app with Expo
2. Implement Socket.io server for real-time messaging
3. Add push notifications
4. Deploy to Vercel
5. Deploy mobile app to stores

## Support

For issues or questions, please open an issue on GitHub.

Happy chatting! 🏠💬




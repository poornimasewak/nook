# Nook - Your Cozy Chat Space 🏠

A full-stack real-time chat application built with React Native (Expo), Next.js, Supabase, and Socket.io.

## Features

### 🎯 Core Features
- **Email authentication** with OTP verification via MojoAuth
- **Real-time messaging** with Socket.io
- **Group chats (Nooks)** with up to 100 members
- **Direct messaging** between friends
- **Rich message types** (text, images, videos, files, emojis)
- **Message reactions** and replies
- **Read receipts** and typing indicators
- **Push notifications** for new messages
- **Online/offline status** tracking
- **Nook management** with admin controls

### 🎨 Design
- Modern, cozy UI with Tailwind CSS (NativeWind)
- Teal, Blue, and Orange color scheme
- Smooth animations and micro-interactions
- Responsive design for all screen sizes
- Clean, spacious layout

## Tech Stack

### Frontend
- React Native with Expo
- NativeWind (Tailwind CSS for React Native)
- React Navigation
- Socket.io-client
- React Native Async Storage

### Backend
- Next.js API routes
- Supabase (PostgreSQL database)
- Socket.io for WebSockets
- JWT for authentication
- MojoAuth for email OTP (optional)

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Supabase account
- MojoAuth account (optional - for email OTP in production)
- Expo CLI installed globally: `npm install -g expo-cli`

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd nook
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Fill in your credentials in `.env.local`:
- Supabase URL and keys
- JWT secrets
- MojoAuth API key (optional)
- Socket.io port

4. **Set up Supabase database**
- Create a new Supabase project
- Run the SQL script from `database/schema.sql` in the Supabase SQL editor
- Create a storage bucket named `nook-files`

5. **Set up MojoAuth for Email OTP (optional)**
- Create a MojoAuth account at https://mojoauth.com
- Add API key to `.env.local` as `NEXT_PUBLIC_MOJOAUTH_API_KEY`
- See `MOJOAUTH_QUICKSTART.md` for detailed instructions
- **Note**: In development mode, OTP is logged to console

6. **Start the development server**
```bash
npm run dev
```

### Mobile App Setup (Separate Project)

The mobile app should be in a separate `mobile` directory. To set it up:

```bash
cd mobile
npm install
npx expo start
```

## Project Structure

```
nook/
├── pages/
│   └── api/              # Next.js API routes
│       ├── auth/         # Authentication endpoints
│       ├── users/        # User management
│       ├── nooks/        # Nook management
│       └── messages/     # Message handling
├── lib/                  # Utility functions
│   ├── supabase.ts      # Supabase client
│   ├── auth.ts          # JWT and OTP handling
│   ├── email-otp.ts     # Email OTP sending
│   └── types.ts         # TypeScript types
├── database/
│   └── schema.sql       # Database schema
└── public/              # Static assets
```

## API Endpoints

### Authentication
- `POST /api/auth/send-email-otp` - Send OTP to email
- `POST /api/auth/verify-email-otp` - Verify email OTP and login
- `POST /api/auth/send-otp` - Send OTP to phone (deprecated)
- `POST /api/auth/verify-otp` - Verify phone OTP (deprecated)
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/deactivate` - Deactivate account

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/search?q=name` - Search users
- `POST /api/users/invite` - Send invitation

### Nooks
- `GET /api/nooks` - Get all nooks
- `POST /api/nooks` - Create nook
- `GET /api/nooks/:id` - Get nook details
- `PUT /api/nooks/:id` - Update nook (admin)
- `DELETE /api/nooks/:id` - Delete nook (admin)
- `POST /api/nooks/:id/members` - Add member
- `POST /api/nooks/:id/admins` - Promote to admin
- `POST /api/nooks/:id/leave` - Leave nook

### Messages
- `GET /api/messages/:nookId` - Get messages (paginated)

## Socket.io Events

### Connection
- `connection` - User connects
- `disconnect` - User disconnects

### Messaging
- `send-message` - Send message
- `receive-message` - Receive new message
- `typing-start` - User starts typing
- `typing-stop` - User stops typing

### Nooks
- `join-nook` - Join nook
- `leave-nook` - Leave nook
- `member-added` - New member added
- `member-removed` - Member removed

## Deployment

### Backend (Vercel)
1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy

### Mobile App
1. Build with Expo: `eas build`
2. Submit to App Store/Play Store

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ for cozy conversations

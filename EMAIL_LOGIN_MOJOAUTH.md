# Email Login with MojoAuth Integration

## Overview
The login page has been updated to use email-based authentication with OTP (One-Time Password) verification powered by MojoAuth. Users can now sign up or log in using their full name and email address.

## Features Implemented

### 1. **Beautiful Login Design**
- Colorful gradient background (cyan → teal → orange)
- Centered white card with gradient logo
- Modern, clean UI matching the provided design
- Smooth animations and transitions

### 2. **Form Fields**
- **Full Name**: Required text input with error indicator
- **Email**: Required email input with validation
- Both fields must be filled before submission

### 3. **MojoAuth Integration**
- Automatic loading of MojoAuth SDK
- Email OTP sending via MojoAuth API
- Fallback to custom API if MojoAuth is not configured
- Seamless integration with existing authentication flow

### 4. **OTP Verification**
- 6-digit OTP code sent to user's email
- Verification page supports both email and phone OTP
- Automatic redirection after successful verification
- Token-based authentication with JWT

### 5. **Error Handling**
- Visual error indicator on Full Name field (red badge)
- Error messages for validation failures
- Network error handling
- User-friendly error messages

## File Structure

```
app/
├── login/
│   ├── page.tsx                     # Updated login page with email/name fields
│   └── verify/
│       └── page.tsx                 # Updated to support email OTP verification
lib/
├── auth.ts                          # Added email OTP storage functions
└── email-otp.ts                     # Email OTP sending utility (NEW)
pages/
└── api/
    └── auth/
        ├── send-email-otp.ts        # API endpoint to send email OTP (NEW)
        └── verify-email-otp.ts      # API endpoint to verify email OTP (NEW)
```

## Setup Instructions

### 1. Get MojoAuth API Key

1. Sign up for a MojoAuth account at [https://mojoauth.com](https://mojoauth.com)
2. Create a new project in the MojoAuth dashboard
3. Copy your API key from the dashboard

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```bash
NEXT_PUBLIC_MOJOAUTH_API_KEY=your-mojoauth-api-key-here
```

### 3. Install Dependencies (Already Included)

No additional npm packages required! The MojoAuth SDK is loaded via CDN.

## How It Works

### User Flow

1. **User visits `/login`**
   - Sees a beautiful form with Full Name and Email fields
   - MojoAuth SDK loads automatically in the background

2. **User fills both fields and clicks "Verify for your cozy nook"**
   - Form validates both fields are filled
   - Email format is validated
   - If Full Name is missing, shows red error badge

3. **OTP is sent**
   - If MojoAuth is configured: Uses MojoAuth SDK to send OTP
   - If MojoAuth is not configured: Uses fallback custom API
   - In development mode: OTP is logged to console

4. **User is redirected to `/login/verify`**
   - Sees 6-digit OTP input fields
   - Enters OTP received in email
   - Can resend OTP if needed

5. **OTP is verified**
   - System verifies the OTP
   - Creates or updates user account
   - Generates JWT tokens
   - Redirects to dashboard/setup

### Technical Flow

#### Login Process
```
User submits form
    ↓
Validate Full Name & Email
    ↓
Check if MojoAuth SDK is loaded
    ↓
Yes → Use MojoAuth.signInWithEmailOTP()
No  → Use /api/auth/send-email-otp
    ↓
Store email & fullName in localStorage
    ↓
Redirect to /login/verify
```

#### Verification Process
```
User enters OTP
    ↓
POST to /api/auth/verify-email-otp
    ↓
Verify OTP against stored value
    ↓
Check if user exists in database
    ↓
Create new user OR update existing user
    ↓
Generate JWT tokens
    ↓
Return tokens & user data
    ↓
Redirect to dashboard/setup
```

## API Endpoints

### POST `/api/auth/send-email-otp`

Sends an OTP to the user's email address.

**Request Body:**
```json
{
  "email": "user@example.com",
  "fullName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully to your email",
  "isNewUser": false
}
```

### POST `/api/auth/verify-email-otp`

Verifies the OTP and logs in the user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "fullName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt-access-token",
  "refreshToken": "jwt-refresh-token",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

## Development Mode

In development mode, OTPs are logged to the console:

```
======================================================================
📧 EMAIL OTP VERIFICATION
======================================================================
To: user@example.com
Name: John Doe
OTP Code: 123456
Expires in: 5 minutes
======================================================================
```

Check your terminal where `npm run dev` is running to see the OTP codes.

## Production Deployment

### Email Service Integration

For production, you need to integrate an email service to actually send emails. The `lib/email-otp.ts` file contains commented examples for:

1. **SendGrid** (Recommended)
2. **Nodemailer** (SMTP)
3. **AWS SES**

#### Example: SendGrid Integration

1. Install SendGrid:
```bash
npm install @sendgrid/mail
```

2. Get SendGrid API key from [https://sendgrid.com](https://sendgrid.com)

3. Add to `.env.local`:
```bash
SENDGRID_API_KEY=your-sendgrid-api-key
```

4. Uncomment the SendGrid code in `lib/email-otp.ts`

## Security Features

- **OTP Expiration**: OTPs expire after 5 minutes
- **One-time Use**: OTPs are deleted after successful verification
- **Email Validation**: Email format is validated on both client and server
- **JWT Tokens**: Secure token-based authentication
- **Refresh Tokens**: Long-lived refresh tokens for session management

## Customization

### Change OTP Expiration Time

Edit `lib/auth.ts`:
```typescript
export function storeEmailOTP(email: string, otp: string, fullName: string): void {
    const expiresAt = Date.now() + 10 * 60 * 1000; // Change to 10 minutes
    // ...
}
```

### Customize Email Template

Edit `lib/email-otp.ts` to modify the HTML template sent in emails.

### Change Redirect After Login

Edit `app/login/verify/page.tsx`:
```typescript
setTimeout(() => {
  window.location.href = '/chatroom'; // Change destination
}, 1500);
```

## Troubleshooting

### OTP Not Received

1. **Check Console**: In development, OTP is logged to terminal
2. **Check Spam Folder**: Production emails might go to spam
3. **Verify Email Service**: Ensure email service is configured correctly
4. **Check API Response**: Look for errors in browser console

### MojoAuth Not Working

1. **Check API Key**: Verify `NEXT_PUBLIC_MOJOAUTH_API_KEY` is set
2. **Check SDK Loading**: Open browser console and check for script load errors
3. **Use Fallback**: The system automatically falls back to custom API if MojoAuth fails

### Database Errors

1. **Supabase Not Configured**: The system works without Supabase (temporary user IDs)
2. **Table Not Found**: Ensure `users` table exists in your database
3. **Check Logs**: Server logs show detailed error messages

## Testing

### Test Email Login Flow

1. Navigate to `http://localhost:3000/login`
2. Enter any name and email
3. Click "Verify for your cozy nook"
4. Check terminal for OTP code
5. Enter OTP on verification page
6. Verify successful login

### Test Error Handling

1. Try submitting without Full Name → Should show red error badge
2. Try invalid email format → Should show error message
3. Try wrong OTP → Should show "Invalid OTP" error
4. Try expired OTP (wait 5+ minutes) → Should show "Expired OTP" error

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Mobile Responsive

The login page is fully responsive and works on:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## Accessibility

- Proper label associations
- Keyboard navigation support
- Screen reader friendly
- High contrast error indicators
- Focus states on all interactive elements

## Future Enhancements

- [ ] Social login (Google, GitHub, etc.)
- [ ] Remember me functionality
- [ ] Password-based login option
- [ ] Two-factor authentication
- [ ] Email verification link (alternative to OTP)
- [ ] Account recovery flow
- [ ] Rate limiting for OTP requests
- [ ] CAPTCHA integration

---

## Support

For issues or questions:
- Check the console for error messages
- Review the API response in Network tab
- Verify environment variables are set correctly
- Check that all required fields are filled

**Note**: This implementation includes both MojoAuth integration and a custom fallback system, ensuring reliability even if MojoAuth is not configured.



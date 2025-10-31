# Nook API Documentation

Complete API reference for the Nook chat application backend.

## Base URL

```
Development: http://localhost:3000
Production: https://your-domain.vercel.app
```

## Authentication

Most endpoints require authentication using a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Tokens are obtained from the `/api/auth/verify-otp` endpoint.

---

## Authentication Endpoints

### Send OTP

Send a 6-digit OTP to a phone number.

**Endpoint:** `POST /api/auth/send-otp`

**Request Body:**
```json
{
  "phoneNumber": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "isNewUser": false
}
```

**Note:** In development mode, OTP is logged to console instead of being sent via SMS.

---

### Verify OTP

Verify the OTP and authenticate the user.

**Endpoint:** `POST /api/auth/verify-otp`

**Request Body:**
```json
{
  "phoneNumber": "+1234567890",
  "otp": "123456",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "phone_number": "+1234567890",
    "display_picture": null,
    "is_online": true,
    "last_seen": "2025-01-15T10:30:00Z",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

---

### Logout

Log out the current user and update their online status.

**Endpoint:** `POST /api/auth/logout`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Deactivate Account

Deactivate the current user's account (soft delete).

**Endpoint:** `POST /api/auth/deactivate`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Account deactivated successfully"
}
```

---

## User Endpoints

### Get User Profile

Retrieve the current user's profile information.

**Endpoint:** `GET /api/users/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "phone_number": "+1234567890",
    "display_picture": "https://...",
    "is_online": true,
    "last_seen": "2025-01-15T10:30:00Z",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

---

### Update User Profile

Update the current user's profile.

**Endpoint:** `PUT /api/users/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Smith",
  "displayPicture": "https://..."
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Smith",
    "phone_number": "+1234567890",
    "display_picture": "https://...",
    "is_online": true,
    "last_seen": "2025-01-15T10:30:00Z",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

---

### Search Users

Search for users by name.

**Endpoint:** `GET /api/users/search?q=john`

**Query Parameters:**
- `q` (required): Search query

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "name": "John Doe",
      "phone_number": "+1234567890",
      "display_picture": null,
      "is_online": true,
      "last_seen": "2025-01-15T10:30:00Z"
    }
  ]
}
```

---

### Send Invitation

Send an invitation SMS to a phone number.

**Endpoint:** `POST /api/users/invite`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "phoneNumber": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invitation sent successfully"
}
```

**Error Response:**
```json
{
  "error": "User already exists on Nook"
}
```

---

## Nooks Endpoints

### Get All Nooks

Retrieve all nooks the user is a member of.

**Endpoint:** `GET /api/nooks`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "nooks": [
    {
      "id": "uuid",
      "name": "Study Group",
      "avatar": "https://...",
      "background": null,
      "created_by": "uuid",
      "created_at": "2025-01-01T00:00:00Z",
      "last_activity": "2025-01-15T10:30:00Z",
      "lastMessage": "Hey everyone!",
      "lastMessageTime": "2025-01-15T10:25:00Z",
      "unreadCount": 3,
      "nook_members": [...]
    }
  ]
}
```

**Note:** Nooks are sorted by: pinned first, then by last activity.

---

### Create Nook

Create a new nook.

**Endpoint:** `POST /api/nooks`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Study Group",
  "avatar": "https://...",
  "background": null
}
```

**Response:**
```json
{
  "nook": {
    "id": "uuid",
    "name": "Study Group",
    "avatar": "https://...",
    "background": null,
    "created_by": "uuid",
    "created_at": "2025-01-15T10:30:00Z",
    "last_activity": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z"
  }
}
```

---

### Get Nook Details

Retrieve details of a specific nook.

**Endpoint:** `GET /api/nooks/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "nook": {
    "id": "uuid",
    "name": "Study Group",
    "avatar": "https://...",
    "background": null,
    "created_by": "uuid",
    "created_at": "2025-01-01T00:00:00Z",
    "last_activity": "2025-01-15T10:30:00Z"
  },
  "members": [
    {
      "id": "uuid",
      "nook_id": "uuid",
      "user_id": "uuid",
      "is_admin": true,
      "is_pinned": false,
      "is_muted": false,
      "users": {
        "id": "uuid",
        "name": "John Doe",
        "display_picture": null,
        "is_online": true,
        "last_seen": "2025-01-15T10:30:00Z"
      }
    }
  ]
}
```

---

### Update Nook

Update a nook (admin only).

**Endpoint:** `PUT /api/nooks/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "avatar": "https://...",
  "background": "https://..."
}
```

**Response:**
```json
{
  "nook": {
    "id": "uuid",
    "name": "Updated Name",
    "avatar": "https://...",
    "background": "https://...",
    "created_by": "uuid",
    "created_at": "2025-01-01T00:00:00Z",
    "last_activity": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:35:00Z"
  }
}
```

**Error Response (403):**
```json
{
  "error": "Only admins can update nook"
}
```

---

### Delete Nook

Delete a nook (admin only).

**Endpoint:** `DELETE /api/nooks/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true
}
```

---

### Add Member to Nook

Add a member to a nook (admin only).

**Endpoint:** `POST /api/nooks/:id/members`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "userId": "uuid"
}
```

**Response:**
```json
{
  "success": true
}
```

**Error Response (400):**
```json
{
  "error": "Nook has reached the 100 member limit"
}
```

---

### Promote to Admin

Promote a member to admin (admin only).

**Endpoint:** `POST /api/nooks/:id/admins`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "userId": "uuid"
}
```

**Response:**
```json
{
  "success": true
}
```

---

### Leave Nook

Leave a nook. If you're the last member, the nook will be deleted.

**Endpoint:** `POST /api/nooks/:id/leave`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Nook deleted as you were the last member"
}
```

---

## Messages Endpoints

### Get Messages

Retrieve messages for a nook (paginated).

**Endpoint:** `GET /api/messages/:nookId?page=0`

**Query Parameters:**
- `page` (optional): Page number (default: 0, 50 messages per page)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "nook_id": "uuid",
      "sender_id": "uuid",
      "message_type": "text",
      "content": "Hello everyone!",
      "file_name": null,
      "file_size": null,
      "reply_to": null,
      "timestamp": "2025-01-15T10:30:00Z",
      "is_deleted": false,
      "sender": {
        "id": "uuid",
        "name": "John Doe",
        "display_picture": null
      },
      "reactions": [
        {
          "id": "uuid",
          "message_id": "uuid",
          "user_id": "uuid",
          "emoji": "👍",
          "created_at": "2025-01-15T10:31:00Z"
        }
      ]
    }
  ],
  "hasMore": true
}
```

---

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request:**
```json
{
  "error": "Error message describing what went wrong"
}
```

**401 Unauthorized:**
```json
{
  "error": "Unauthorized"
}
```

**403 Forbidden:**
```json
{
  "error": "Only admins can perform this action"
}
```

**404 Not Found:**
```json
{
  "error": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

---

## WebSocket Events (Socket.io)

Real-time events are handled via Socket.io. Connect to the Socket.io server and listen for events:

**Connection:**
```javascript
const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('Connected to Nook');
});
```

**Events:**

- `receive-message` - New message received
- `message-delivered` - Message delivery confirmed
- `message-read` - Message read confirmation
- `typing-start` - User started typing
- `typing-stop` - User stopped typing
- `join-nook` - User joined nook
- `leave-nook` - User left nook
- `member-added` - Member added to nook
- `member-removed` - Member removed from nook
- `nook-updated` - Nook details updated

---

## Rate Limiting

Currently, there is no rate limiting implemented. Consider adding rate limiting in production.

## CORS

CORS is enabled for the domain configured in `NEXT_PUBLIC_API_URL`. Update this to allow your mobile app domain.

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Phone numbers must be in E.164 format (+1234567890)
- Maximum 100 members per nook
- Messages are paginated with 50 messages per page
- OTPs expire after 5 minutes
- JWT tokens expire after 7 days




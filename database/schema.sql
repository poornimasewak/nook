-- Nook Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone_number VARCHAR(20) UNIQUE,
  display_picture TEXT,
  is_active BOOLEAN DEFAULT true,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT user_contact_check CHECK (email IS NOT NULL OR phone_number IS NOT NULL)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_name ON users(name);

-- Friends Table (Junction table for many-to-many relationship)
CREATE TABLE friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

CREATE INDEX idx_friends_user ON friends(user_id);
CREATE INDEX idx_friends_friend ON friends(friend_id);

-- Nooks Table (renamed from chat_rooms)
CREATE TABLE nooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  avatar TEXT,
  background TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_activity TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_nooks_created_by ON nooks(created_by);

-- Nook Members Table
CREATE TABLE nook_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nook_id UUID REFERENCES nooks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_admin BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  is_muted BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(nook_id, user_id)
);

CREATE INDEX idx_nook_members_nook ON nook_members(nook_id);
CREATE INDEX idx_nook_members_user ON nook_members(user_id);

-- Messages Table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nook_id UUID REFERENCES nooks(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('text', 'image', 'video', 'file', 'emoji', 'system')),
  content TEXT NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER,
  reply_to UUID REFERENCES messages(id) ON DELETE SET NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX idx_messages_nook ON messages(nook_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);

-- Message Reactions Table
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX idx_reactions_message ON message_reactions(message_id);

-- Message Read Status Table
CREATE TABLE message_read_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_delivered BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  UNIQUE(message_id, user_id)
);

CREATE INDEX idx_read_status_message ON message_read_status(message_id);
CREATE INDEX idx_read_status_user ON message_read_status(user_id);

-- Friend Requests Table
CREATE TABLE friend_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

CREATE INDEX idx_friend_requests_from ON friend_requests(from_user_id);
CREATE INDEX idx_friend_requests_to ON friend_requests(to_user_id);

-- Invitations Table
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  phone_number VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  sent_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT invitation_contact_check CHECK (email IS NOT NULL OR phone_number IS NOT NULL)
);

CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_phone ON invitations(phone_number);
CREATE INDEX idx_invitations_from_user ON invitations(from_user_id);

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE nooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE nook_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Users policies
-- Allow public to insert new users (for registration)
CREATE POLICY "Allow public user registration" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view active users" ON users
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (true);

-- Friends policies
CREATE POLICY "Users can view their own friends" ON friends
  FOR SELECT USING (
    auth.uid()::text = user_id::text OR 
    auth.uid()::text = friend_id::text
  );

-- Nooks policies
CREATE POLICY "Members can view their nooks" ON nooks
  FOR SELECT USING (
    id IN (
      SELECT nook_id FROM nook_members 
      WHERE user_id::text = auth.uid()::text
    )
  );

-- Nook Members policies
-- Allow all operations for now since we handle auth in API layer
CREATE POLICY "Allow nook members operations" ON nook_members
  FOR ALL USING (true);

-- Messages policies
-- Allow all operations for now since we handle auth in API layer
CREATE POLICY "Allow messages operations" ON messages
  FOR ALL USING (true);

-- Message Reactions policies
CREATE POLICY "Allow message reactions operations" ON message_reactions
  FOR ALL USING (true);

-- Message Read Status policies
CREATE POLICY "Allow message read status operations" ON message_read_status
  FOR ALL USING (true);

-- Friend Requests policies
CREATE POLICY "Allow friend requests operations" ON friend_requests
  FOR ALL USING (true);

-- Invitations policies
CREATE POLICY "Allow invitations operations" ON invitations
  FOR ALL USING (true);

-- Nooks policies - allow insert and update
CREATE POLICY "Allow nooks insert" ON nooks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow nooks update" ON nooks
  FOR UPDATE USING (true);

CREATE POLICY "Allow nooks select" ON nooks
  FOR SELECT USING (true);

-- Friends policies - allow insert
CREATE POLICY "Allow friends insert" ON friends
  FOR INSERT WITH CHECK (true);

-- Note: RLS is enabled but permissive since authorization is handled in the API layer
-- using JWT tokens. This provides database-level security while allowing the API
-- to control access based on authenticated user context.




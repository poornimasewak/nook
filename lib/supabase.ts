import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create Supabase client only if credentials are provided
let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey && 
    supabaseUrl !== 'your-supabase-project-url' && 
    supabaseKey !== 'your-supabase-anon-key') {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export { supabase };

// Types for database tables
export interface User {
    id: string;
    name: string;
    phone_number: string;
    display_picture: string | null;
    is_active: boolean;
    is_online: boolean;
    last_seen: string | null;
    created_at: string;
    updated_at: string;
}

export interface Nook {
    id: string;
    name: string;
    avatar: string | null;
    background: string | null;
    created_by: string;
    created_at: string;
    last_activity: string;
    updated_at: string;
}

export interface NookMember {
    id: string;
    nook_id: string;
    user_id: string;
    is_admin: boolean;
    is_pinned: boolean;
    is_muted: boolean;
    is_archived: boolean;
    joined_at: string;
}

export interface Message {
    id: string;
    nook_id: string | null;
    sender_id: string;
    receiver_id: string | null;
    message_type: 'text' | 'image' | 'video' | 'file' | 'emoji' | 'system';
    content: string;
    file_name: string | null;
    file_size: number | null;
    reply_to: string | null;
    timestamp: string;
    is_deleted: boolean;
}

export interface Friend {
    id: string;
    user_id: string;
    friend_id: string;
    created_at: string;
}

export interface FriendRequest {
    id: string;
    from_user_id: string;
    to_user_id: string;
    status: 'pending' | 'accepted' | 'declined';
    created_at: string;
    updated_at: string;
}



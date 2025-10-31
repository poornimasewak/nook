export interface AuthToken {
    userId: string;
    phoneNumber?: string;
    email?: string;
}

export interface OTPData {
    phoneNumber: string;
    otp: string;
    expiresAt: number;
}

export interface SocketUser {
    userId: string;
    socketId: string;
    isOnline: boolean;
}

export interface MessageReaction {
    id: string;
    message_id: string;
    user_id: string;
    emoji: string;
    created_at: string;
}

export interface ReadStatus {
    id: string;
    message_id: string;
    user_id: string;
    is_delivered: boolean;
    is_read: boolean;
    delivered_at: string | null;
    read_at: string | null;
}




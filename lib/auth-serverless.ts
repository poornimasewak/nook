import jwt from 'jsonwebtoken';
import { AuthToken } from './types';
import { supabase } from './supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';

export function generateToken(userId: string, identifier: string): string {
    return jwt.sign({ userId, email: identifier, phoneNumber: identifier }, JWT_SECRET, { expiresIn: '7d' });
}

export function generateRefreshToken(userId: string, identifier: string): string {
    return jwt.sign({ userId, email: identifier, phoneNumber: identifier }, JWT_REFRESH_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): AuthToken | null {
    try {
        return jwt.verify(token, JWT_SECRET) as AuthToken;
    } catch (error) {
        return null;
    }
}

export function verifyRefreshToken(token: string): AuthToken | null {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET) as AuthToken;
    } catch (error) {
        return null;
    }
}

export interface EmailOTPData {
    email: string;
    otp: string;
    fullName: string;
    expiresAt: number;
}

// In-memory fallback for local development (NOT for production!)
const devOtpStore = new Map<string, EmailOTPData>();

/**
 * Store Email OTP - Serverless Compatible
 * Uses Supabase if available, falls back to in-memory (dev only)
 */
export async function storeEmailOTP(email: string, otp: string, fullName: string): Promise<boolean> {
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    if (supabase) {
        try {
            // Delete any existing OTPs for this email
            await supabase
                .from('email_otps')
                .delete()
                .eq('email', email);

            // Store new OTP
            const { error } = await supabase
                .from('email_otps')
                .insert([
                    {
                        email,
                        otp,
                        full_name: fullName,
                        expires_at: new Date(expiresAt).toISOString(),
                        created_at: new Date().toISOString(),
                    },
                ]);

            if (error) {
                console.error('Error storing OTP in Supabase:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in storeEmailOTP:', error);
            return false;
        }
    } else {
        // Fallback for LOCAL development ONLY
        // ⚠️ This will NOT work in production/serverless!
        console.warn('⚠️ Using in-memory OTP storage (dev only). Configure Supabase for production!');
        
        devOtpStore.set(email, { email, otp, fullName, expiresAt });
        
        // Auto-cleanup
        setTimeout(() => devOtpStore.delete(email), 5 * 60 * 1000);
        
        console.log(`📝 Stored OTP in memory: ${email} -> ${otp}`);
        return true;
    }
}

/**
 * Verify Email OTP - Serverless Compatible
 */
export async function verifyEmailOTP(
    email: string,
    otp: string
): Promise<{ isValid: boolean; fullName?: string }> {
    if (supabase) {
        try {
            // Find OTP record
            const { data, error } = await supabase
                .from('email_otps')
                .select('*')
                .eq('email', email)
                .eq('otp', otp)
                .single();

            if (error || !data) {
                console.log('OTP not found or error:', error);
                return { isValid: false };
            }

            // Check if expired
            const expiresAt = new Date(data.expires_at).getTime();
            if (Date.now() > expiresAt) {
                // Delete expired OTP
                await supabase.from('email_otps').delete().eq('email', email);
                console.log('OTP expired');
                return { isValid: false };
            }

            // Valid OTP - delete it
            await supabase.from('email_otps').delete().eq('email', email);

            return { isValid: true, fullName: data.full_name };
        } catch (error) {
            console.error('Error in verifyEmailOTP:', error);
            return { isValid: false };
        }
    } else {
        // Fallback for LOCAL development ONLY
        console.warn('⚠️ Using in-memory OTP verification (dev only)');
        
        const stored = devOtpStore.get(email);
        if (!stored) {
            console.log('OTP not found in memory store');
            return { isValid: false };
        }

        if (Date.now() > stored.expiresAt) {
            devOtpStore.delete(email);
            console.log('OTP expired');
            return { isValid: false };
        }

        if (stored.otp !== otp) {
            console.log('OTP mismatch');
            return { isValid: false };
        }

        // Valid!
        const fullName = stored.fullName;
        devOtpStore.delete(email);
        console.log('✅ OTP verified successfully');
        return { isValid: true, fullName };
    }
}

export function generateRandomOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}


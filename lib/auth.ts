import jwt from 'jsonwebtoken';
import { AuthToken } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';

export function generateToken(userId: string, identifier: string): string {
    // identifier can be phoneNumber or email
    return jwt.sign({ userId, email: identifier, phoneNumber: identifier }, JWT_SECRET, { expiresIn: '7d' });
}

export function generateRefreshToken(userId: string, identifier: string): string {
    // identifier can be phoneNumber or email
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

// OTP storage (in production, use Redis or similar)
const otpStore = new Map<string, OTPData>();
const emailOtpStore = new Map<string, EmailOTPData>();

export interface OTPData {
    phoneNumber: string;
    otp: string;
    expiresAt: number;
}

export interface EmailOTPData {
    email: string;
    otp: string;
    fullName: string;
    expiresAt: number;
}

export function storeOTP(phoneNumber: string, otp: string): void {
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    otpStore.set(phoneNumber, { phoneNumber, otp, expiresAt });

    // Cleanup after expiration
    setTimeout(() => {
        otpStore.delete(phoneNumber);
    }, 5 * 60 * 1000);
}

export function verifyOTP(phoneNumber: string, otp: string): boolean {
    const stored = otpStore.get(phoneNumber);
    if (!stored) return false;

    if (Date.now() > stored.expiresAt) {
        otpStore.delete(phoneNumber);
        return false;
    }

    const isValid = stored.otp === otp;
    if (isValid) {
        otpStore.delete(phoneNumber);
    }

    return isValid;
}

export function storeEmailOTP(email: string, otp: string, fullName: string): void {
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    emailOtpStore.set(email, { email, otp, fullName, expiresAt });

    // Cleanup after expiration
    setTimeout(() => {
        emailOtpStore.delete(email);
    }, 5 * 60 * 1000);
}

export function verifyEmailOTP(email: string, otp: string): { isValid: boolean; fullName?: string } {
    const stored = emailOtpStore.get(email);
    if (!stored) return { isValid: false };

    if (Date.now() > stored.expiresAt) {
        emailOtpStore.delete(email);
        return { isValid: false };
    }

    const isValid = stored.otp === otp;
    if (isValid) {
        const fullName = stored.fullName;
        emailOtpStore.delete(email);
        return { isValid: true, fullName };
    }

    return { isValid: false };
}

export function generateRandomOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}



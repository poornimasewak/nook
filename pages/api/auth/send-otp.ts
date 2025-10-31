import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { generateRandomOTP, storeOTP } from '../../../lib/auth';

/**
 * Phone OTP endpoint (deprecated - use email OTP instead)
 * This endpoint is kept for backward compatibility but SMS sending has been removed.
 * In development mode, OTP is logged to console.
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        // Validate phone number format (basic validation)
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        if (!phoneRegex.test(phoneNumber)) {
            return res.status(400).json({ error: 'Invalid phone number format' });
        }

        // Check if user already exists (if Supabase is configured)
        let existingUser = null;
        if (supabase) {
            const result = await supabase
                .from('users')
                .select('id')
                .eq('phone_number', phoneNumber)
                .single();
            existingUser = result.data;
        }

        // Generate and store OTP
        const otp = generateRandomOTP();
        storeOTP(phoneNumber, otp);

        // In development mode, log OTP to console
        if (process.env.NODE_ENV === 'development') {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`📱 PHONE OTP (Development Mode)`);
            console.log(`${'='.repeat(60)}`);
            console.log(`Phone: ${phoneNumber}`);
            console.log(`OTP Code: ${otp}`);
            console.log(`⏰ Expires in: 5 minutes`);
            console.log(`${'='.repeat(60)}\n`);
        } else {
            // In production, SMS sending is not configured
            return res.status(501).json({ 
                error: 'SMS OTP is not configured. Please use email verification instead.' 
            });
        }

        return res.status(200).json({
            success: true,
            message: 'OTP generated (check console in development mode)',
            isNewUser: !existingUser
        });
    } catch (error) {
        console.error('Error generating OTP:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}



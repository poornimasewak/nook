import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { generateRandomOTP, storeEmailOTP } from '../../../lib/auth-serverless';
import { sendEmailOTP } from '../../../lib/email-otp';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, fullName } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        if (!fullName) {
            return res.status(400).json({ error: 'Full name is required' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Check if user already exists (if Supabase is configured)
        let existingUser = null;
        if (supabase) {
            const result = await supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .maybeSingle(); // Use maybeSingle() to avoid error when user doesn't exist
            existingUser = result.data;
        }

        // Generate and send OTP
        const otp = generateRandomOTP();
        const stored = await storeEmailOTP(email, otp, fullName);
        
        if (!stored && !supabase) {
            console.error('⚠️ Failed to store OTP - Supabase not configured');
            return res.status(500).json({ 
                error: 'OTP storage failed. Please configure Supabase.' 
            });
        }

        // Try to send OTP via email service
        const sent = await sendEmailOTP(email, otp, fullName);

        // Always log OTP to console (visible in Vercel logs for testing)
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📧 OTP for ${email}: ${otp}`);
        console.log(`👤 Full Name: ${fullName}`);
        console.log(`⏰ This code expires in 5 minutes`);
        console.log(`🔧 Email sent: ${sent ? 'Yes' : 'No (check Vercel logs for OTP)'}`);
        console.log(`${'='.repeat(60)}\n`);

        return res.status(200).json({
            success: true,
            message: 'OTP sent successfully to your email',
            isNewUser: !existingUser
        });
    } catch (error) {
        console.error('Error sending email OTP:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}



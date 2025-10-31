import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { verifyOTP, generateToken, generateRefreshToken } from '../../../lib/auth';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { phoneNumber, otp, name } = req.body;

        if (!phoneNumber || !otp) {
            return res.status(400).json({ error: 'Phone number and OTP are required' });
        }

        // Verify OTP
        const isValidOTP = verifyOTP(phoneNumber, otp);
        if (!isValidOTP) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        // Check if Supabase is configured
        if (!supabase) {
            return res.status(500).json({ error: 'Database not configured. Please set up Supabase.' });
        }

        // Check if user exists
        let { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('phone_number', phoneNumber)
            .single();

        // If user doesn't exist, create new user
        if (!user && userError?.code === 'PGRST116') {
            if (!name) {
                return res.status(400).json({ error: 'Name is required for new users' });
            }

            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                    phone_number: phoneNumber,
                    name: name,
                    is_active: true,
                    is_online: true,
                })
                .select()
                .single();

            if (createError) {
                console.error('Error creating user:', createError);
                return res.status(500).json({ error: 'Failed to create user' });
            }

            user = newUser;
        } else if (userError) {
            console.error('Error fetching user:', userError);
            return res.status(500).json({ error: 'Internal server error' });
        }

        // If user exists and name is provided, update name
        if (user && name && user.name !== name) {
            const { error: updateError } = await supabase
                .from('users')
                .update({ name, updated_at: new Date().toISOString() })
                .eq('id', user.id);

            if (updateError) {
                console.error('Error updating user name:', updateError);
            }
        }

        // Update online status
        await supabase
            .from('users')
            .update({ is_online: true, last_seen: new Date().toISOString() })
            .eq('id', user.id);

        // Generate tokens
        const token = generateToken(user.id, user.phone_number);
        const refreshToken = generateRefreshToken(user.id, user.phone_number);

        // Remove sensitive data
        const { display_picture, is_active, ...userWithoutSensitive } = user;

        return res.status(200).json({
            success: true,
            token,
            refreshToken,
            user: userWithoutSensitive,
        });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}



import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { verifyEmailOTP, generateToken, generateRefreshToken } from '../../../lib/auth';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, otp, fullName } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required' });
        }

        // Verify OTP
        const verification = verifyEmailOTP(email, otp);
        
        if (!verification.isValid) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        const userName = fullName || verification.fullName || 'User';

        // Check if user exists
        let user = null;
        let userId = null;

        if (supabase) {
            // Try to find existing user
            const { data: existingUser } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (existingUser) {
                user = existingUser;
                userId = existingUser.id;

                // Update last login
                await supabase
                    .from('users')
                    .update({ last_login: new Date().toISOString() })
                    .eq('id', userId);
            } else {
                // Create new user
                const { data: newUser, error: createError } = await supabase
                    .from('users')
                    .insert([
                        {
                            email: email,
                            name: userName,
                            created_at: new Date().toISOString(),
                            last_login: new Date().toISOString(),
                        },
                    ])
                    .select()
                    .single();

                if (createError) {
                    console.error('Error creating user:', createError);
                    return res.status(500).json({ error: 'Failed to create user account' });
                }

                user = newUser;
                userId = newUser.id;
            }
        } else {
            // Supabase not configured, use temporary user ID
            userId = `user_${Date.now()}`;
            user = {
                id: userId,
                email: email,
                name: userName,
            };
        }

        // Generate tokens
        const token = generateToken(userId, email);
        const refreshToken = generateRefreshToken(userId, email);

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            refreshToken,
            user: {
                id: userId,
                email: email,
                name: userName,
            },
        });
    } catch (error) {
        console.error('Error verifying email OTP:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}



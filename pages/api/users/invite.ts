import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { verifyToken } from '../../../lib/auth';

/**
 * User invitation endpoint
 * Note: SMS invitations have been removed. This endpoint now supports email invitations.
 * Update to accept email parameter instead of phoneNumber for email invitations.
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const { phoneNumber, email } = req.body;

        // Accept either phone or email (email preferred)
        const invitee = email || phoneNumber;
        
        if (!invitee) {
            return res.status(400).json({ error: 'Email or phone number is required' });
        }

        // Check if Supabase is configured
        if (!supabase) {
            return res.status(500).json({ error: 'Database not configured. Please set up Supabase.' });
        }

        // Get user name
        const { data: user } = await supabase
            .from('users')
            .select('name')
            .eq('id', decoded.userId)
            .single();

        // Check if user already exists (by email or phone)
        let existingUser = null;
        if (email) {
            const { data } = await supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .single();
            existingUser = data;
        } else if (phoneNumber) {
            const { data } = await supabase
                .from('users')
                .select('id')
                .eq('phone_number', phoneNumber)
                .single();
            existingUser = data;
        }

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists on Nook' });
        }

        // Log invitation (SMS sending removed)
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📧 INVITATION`);
        console.log(`${'='.repeat(60)}`);
        console.log(`From: ${user?.name || 'Someone'}`);
        console.log(`To: ${invitee}`);
        console.log(`Message: ${user?.name || 'Someone'} invited you to join Nook!`);
        console.log(`${'='.repeat(60)}\n`);

        // TODO: Implement email invitation sending
        // Use lib/email-otp.ts as reference for email service integration

        // Store invitation
        await supabase.from('invitations').insert({
            from_user_id: decoded.userId,
            phone_number: phoneNumber || null,
            email: email || null,
            status: 'pending',
        });

        return res.status(200).json({ 
            success: true, 
            message: 'Invitation logged (email sending not yet implemented)' 
        });
    } catch (error) {
        console.error('Error sending invitation:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}



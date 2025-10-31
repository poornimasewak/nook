import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../lib/supabase';
import { verifyToken } from '../../../../lib/auth';

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

        const { id } = req.query;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Check if Supabase is configured
        if (!supabase) {
            return res.status(500).json({ error: 'Database not configured. Please set up Supabase.' });
        }

        // Check if requester is admin
        const { data: member } = await supabase
            .from('nook_members')
            .select('is_admin')
            .eq('nook_id', id)
            .eq('user_id', decoded.userId)
            .single();

        if (!member?.is_admin) {
            return res.status(403).json({ error: 'Only admins can promote members' });
        }

        // Check if target user is a member
        const { data: targetMember } = await supabase
            .from('nook_members')
            .select('id')
            .eq('nook_id', id)
            .eq('user_id', userId)
            .single();

        if (!targetMember) {
            return res.status(400).json({ error: 'User is not a member of this nook' });
        }

        // Promote to admin
        const { error } = await supabase
            .from('nook_members')
            .update({ is_admin: true })
            .eq('nook_id', id)
            .eq('user_id', userId);

        if (error) {
            console.error('Error promoting member:', error);
            return res.status(500).json({ error: 'Failed to promote member' });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error in admins API:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}



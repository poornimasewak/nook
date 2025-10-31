import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { verifyToken } from '../../../lib/auth';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
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

        const query = req.query.q as string;
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        // Check if Supabase is configured
        if (!supabase) {
            return res.status(500).json({ error: 'Database not configured. Please set up Supabase.' });
        }

        // Search users by name
        const { data: users, error } = await supabase
            .from('users')
            .select('id, name, phone_number, display_picture, is_online, last_seen')
            .ilike('name', `%${query}%`)
            .neq('id', decoded.userId)
            .eq('is_active', true)
            .limit(20);

        if (error) {
            console.error('Error searching users:', error);
            return res.status(500).json({ error: 'Failed to search users' });
        }

        return res.status(200).json({ users: users || [] });
    } catch (error) {
        console.error('Error in user search API:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}



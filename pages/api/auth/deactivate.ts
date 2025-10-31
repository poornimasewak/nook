import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { verifyToken } from '../../../lib/auth';

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

        // Check if Supabase is configured
        if (!supabase) {
            return res.status(500).json({ error: 'Database not configured. Please set up Supabase.' });
        }

        // Deactivate user account (soft delete)
        const { error } = await supabase
            .from('users')
            .update({
                is_active: false,
                is_online: false,
                updated_at: new Date().toISOString()
            })
            .eq('id', decoded.userId);

        if (error) {
            console.error('Error deactivating account:', error);
            return res.status(500).json({ error: 'Failed to deactivate account' });
        }

        return res.status(200).json({ success: true, message: 'Account deactivated successfully' });
    } catch (error) {
        console.error('Error deactivating account:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}



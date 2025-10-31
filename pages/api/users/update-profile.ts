import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { verifyToken } from '../../../lib/auth';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Verify authentication
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);

        if (!decoded || !decoded.userId) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Name is required' });
        }

        if (!supabase) {
            return res.status(500).json({ error: 'Database not configured' });
        }

        // Update user name
        const { data: updatedUser, error } = await supabase
            .from('users')
            .update({ 
                name: name.trim(),
                updated_at: new Date().toISOString()
            })
            .eq('id', decoded.userId)
            .select()
            .single();

        if (error) {
            console.error('Error updating user:', error);
            return res.status(500).json({ error: 'Failed to update profile' });
        }

        return res.status(200).json({ 
            success: true,
            user: updatedUser 
        });
    } catch (error) {
        console.error('Error in update profile API:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}


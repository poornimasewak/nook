import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';
import { verifyToken } from '../../../lib/auth';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
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

        if (req.method === 'GET') {
            // Get user profile
            const { data: user, error } = await supabase
                .from('users')
                .select('id, name, phone_number, display_picture, is_online, last_seen, created_at')
                .eq('id', decoded.userId)
                .single();

            if (error) {
                console.error('Error fetching user profile:', error);
                return res.status(500).json({ error: 'Failed to fetch profile' });
            }

            return res.status(200).json({ user });
        } else if (req.method === 'PUT') {
            // Update user profile
            const { name, displayPicture } = req.body;

            const updateData: any = { updated_at: new Date().toISOString() };
            if (name) updateData.name = name;
            if (displayPicture) updateData.display_picture = displayPicture;

            const { data: user, error } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', decoded.userId)
                .select('id, name, phone_number, display_picture, is_online, last_seen, created_at')
                .single();

            if (error) {
                console.error('Error updating user profile:', error);
                return res.status(500).json({ error: 'Failed to update profile' });
            }

            return res.status(200).json({ user });
        } else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Error in profile API:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}



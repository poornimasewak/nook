import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../lib/supabase';
import { verifyToken } from '../../../../lib/auth';

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

        const { id } = req.query;

        // Check if Supabase is configured
        if (!supabase) {
            return res.status(500).json({ error: 'Database not configured. Please set up Supabase.' });
        }

        if (req.method === 'POST') {
            // Add member to nook
            const { userId } = req.body;

            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }

            // Check if user is admin
            const { data: member } = await supabase
                .from('nook_members')
                .select('is_admin')
                .eq('nook_id', id)
                .eq('user_id', decoded.userId)
                .single();

            if (!member?.is_admin) {
                return res.status(403).json({ error: 'Only admins can add members' });
            }

            // Check member limit (100)
            const { count } = await supabase
                .from('nook_members')
                .select('*', { count: 'exact', head: true })
                .eq('nook_id', id);

            if ((count || 0) >= 100) {
                return res.status(400).json({ error: 'Nook has reached the 100 member limit' });
            }

            // Add member
            const { error } = await supabase
                .from('nook_members')
                .insert({
                    nook_id: id,
                    user_id: userId,
                    is_admin: false,
                    is_pinned: false,
                    is_muted: false,
                    is_archived: false,
                });

            if (error) {
                console.error('Error adding member:', error);
                return res.status(500).json({ error: 'Failed to add member' });
            }

            // Update last activity
            await supabase
                .from('nooks')
                .update({ last_activity: new Date().toISOString() })
                .eq('id', id);

            return res.status(200).json({ success: true });
        } else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Error in members API:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}



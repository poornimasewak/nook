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

        // Check if Supabase is configured
        if (!supabase) {
            return res.status(500).json({ error: 'Database not configured. Please set up Supabase.' });
        }

        // Check how many members are left
        const { count } = await supabase
            .from('nook_members')
            .select('*', { count: 'exact', head: true })
            .eq('nook_id', id);

        if (count === 1) {
            // Last member - delete the nook and all messages
            await supabase.from('nooks').delete().eq('id', id);
            await supabase.from('messages').delete().eq('nook_id', id);

            return res.status(200).json({
                success: true,
                message: 'Nook deleted as you were the last member'
            });
        }

        // Remove member and delete their messages
        await supabase
            .from('nook_members')
            .delete()
            .eq('nook_id', id)
            .eq('user_id', decoded.userId);

        await supabase
            .from('messages')
            .update({ is_deleted: true })
            .eq('nook_id', id)
            .eq('sender_id', decoded.userId);

        // Update last activity
        await supabase
            .from('nooks')
            .update({ last_activity: new Date().toISOString() })
            .eq('id', id);

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error leaving nook:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}



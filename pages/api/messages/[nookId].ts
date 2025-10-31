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

        const { nookId } = req.query;

        // Check if Supabase is configured
        if (!supabase) {
            return res.status(500).json({ error: 'Database not configured. Please set up Supabase.' });
        }

        if (req.method === 'GET') {
            // Get messages for nook
            const page = parseInt(req.query.page as string) || 0;
            const limit = 50;
            const offset = page * limit;

            // Verify user is member of nook
            const { data: member } = await supabase
                .from('nook_members')
                .select('id')
                .eq('nook_id', nookId)
                .eq('user_id', decoded.userId)
                .single();

            if (!member) {
                return res.status(403).json({ error: 'Not a member of this nook' });
            }

            // Fetch messages
            const { data: messages, error } = await supabase
                .from('messages')
                .select(`
          *,
          sender:users!messages_sender_id_fkey(id, name, display_picture),
          reactions:message_reactions(*)
        `)
                .eq('nook_id', nookId)
                .eq('is_deleted', false)
                .order('timestamp', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) {
                console.error('Error fetching messages:', error);
                return res.status(500).json({ error: 'Failed to fetch messages' });
            }

            return res.status(200).json({
                messages: messages?.reverse() || [],
                hasMore: messages?.length === limit
            });
        } else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Error in messages API:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}



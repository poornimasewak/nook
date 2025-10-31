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

        const { id } = req.query;

        // Check if Supabase is configured
        if (!supabase) {
            return res.status(500).json({ error: 'Database not configured. Please set up Supabase.' });
        }

        if (req.method === 'GET') {
            // Get nook details
            const { data: nook, error } = await supabase
                .from('nooks')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching nook:', error);
                return res.status(404).json({ error: 'Nook not found' });
            }

            // Get member IDs
            const { data: memberData } = await supabase
                .from('nook_members')
                .select('user_id')
                .eq('nook_id', id);

            const memberIds = memberData?.map(m => m.user_id) || [];

            // Get member details
            let members: any[] = [];
            if (memberIds.length > 0) {
                const { data: users } = await supabase
                    .from('users')
                    .select('id, name, email, display_picture, is_online')
                    .in('id', memberIds);
                
                members = users || [];
            }

            return res.status(200).json({ nook, members });
        } else if (req.method === 'PUT') {
            // Update nook
            const { name, avatar, background } = req.body;

            // Check if user is admin
            const { data: member } = await supabase
                .from('nook_members')
                .select('is_admin')
                .eq('nook_id', id)
                .eq('user_id', decoded.userId)
                .single();

            if (!member?.is_admin) {
                return res.status(403).json({ error: 'Only admins can update nook' });
            }

            const updateData: any = { updated_at: new Date().toISOString() };
            if (name) updateData.name = name;
            if (avatar) updateData.avatar = avatar;
            if (background) updateData.background = background;

            const { data: nook, error } = await supabase
                .from('nooks')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Error updating nook:', error);
                return res.status(500).json({ error: 'Failed to update nook' });
            }

            return res.status(200).json({ nook });
        } else if (req.method === 'DELETE') {
            // Delete nook (admin only)
            const { data: member } = await supabase
                .from('nook_members')
                .select('is_admin')
                .eq('nook_id', id)
                .eq('user_id', decoded.userId)
                .single();

            if (!member?.is_admin) {
                return res.status(403).json({ error: 'Only admins can delete nook' });
            }

            const { error } = await supabase.from('nooks').delete().eq('id', id);

            if (error) {
                console.error('Error deleting nook:', error);
                return res.status(500).json({ error: 'Failed to delete nook' });
            }

            return res.status(200).json({ success: true });
        } else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Error in nook API:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}



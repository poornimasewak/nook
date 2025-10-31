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

        const userId = decoded.userId;

        // Get friends from database
        if (supabase) {
            // Get all friend relationships
            const { data: friendships, error: friendError } = await supabase
                .from('friends')
                .select('friend_id')
                .eq('user_id', userId);

            if (friendError) {
                console.error('Error fetching friendships:', friendError);
                return res.status(500).json({ error: 'Failed to fetch friends' });
            }

            const friendIds = friendships?.map(f => f.friend_id) || [];

            if (friendIds.length === 0) {
                return res.status(200).json({ friends: [] });
            }

            // Get friend details
            const { data: friends, error: usersError } = await supabase
                .from('users')
                .select('id, name, email, display_picture, is_online, is_active')
                .in('id', friendIds)
                .eq('is_active', true);

            if (usersError) {
                console.error('Error fetching friend details:', usersError);
                return res.status(500).json({ error: 'Failed to fetch friend details' });
            }

            return res.status(200).json({ friends: friends || [] });
        } else {
            // Supabase not configured - return mock data for development
            return res.status(200).json({ 
                friends: [
                    {
                        id: 'friend-1',
                        name: 'Demo Friend',
                        email: 'friend@demo.com',
                        is_online: true,
                        is_active: true
                    }
                ] 
            });
        }
    } catch (error) {
        console.error('Error in friends API:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}


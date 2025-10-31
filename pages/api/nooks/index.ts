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
            // Return mock data for development
            if (req.method === 'GET') {
                return res.status(200).json({ nooks: [] });
            } else if (req.method === 'POST') {
                return res.status(201).json({ 
                    nook: {
                        id: 'mock-nook-' + Date.now(),
                        name: req.body.name,
                        created_at: new Date().toISOString(),
                    }
                });
            }
            return res.status(500).json({ error: 'Database not configured. Please set up Supabase.' });
        }

        // TypeScript: supabase is now guaranteed non-null
        const db = supabase;

        if (req.method === 'GET') {
            // Get all nooks user is a member of
            const { data: nookMembers, error: membersError } = await db
                .from('nook_members')
                .select('nook_id, is_pinned')
                .eq('user_id', decoded.userId)
                .eq('is_archived', false);

            if (membersError) {
                console.error('Error fetching nook members:', membersError);
                return res.status(500).json({ error: 'Failed to fetch nooks' });
            }

            const nookIds = nookMembers?.map(m => m.nook_id) || [];

            if (nookIds.length === 0) {
                return res.status(200).json({ nooks: [] });
            }

            // Fetch nooks with last message
            const { data: nooks, error: nooksError } = await db
                .from('nooks')
                .select('*, nook_members!inner(user_id, is_admin, is_pinned, is_muted)')
                .in('id', nookIds);

            if (nooksError) {
                console.error('Error fetching nooks:', nooksError);
                return res.status(500).json({ error: 'Failed to fetch nooks' });
            }

            // Get last messages for each nook
            const nooksWithMessages = await Promise.all(
                (nooks || []).map(async (nook) => {
                    const { data: lastMessage } = await db
                        .from('messages')
                        .select('id, content, timestamp, sender_id')
                        .eq('nook_id', nook.id)
                        .eq('is_deleted', false)
                        .order('timestamp', { ascending: false })
                        .limit(1)
                        .single();

                    // Get unread count
                    let unreadCount = 0;
                    if (lastMessage) {
                        const { data: readStatus } = await db
                            .from('message_read_status')
                            .select('id')
                            .eq('message_id', lastMessage.id)
                            .eq('user_id', decoded.userId)
                            .eq('is_read', true)
                            .single();

                        unreadCount = readStatus ? 0 : 1;
                    }

                    // Get member count
                    const { count: memberCount } = await db
                        .from('nook_members')
                        .select('*', { count: 'exact', head: true })
                        .eq('nook_id', nook.id);

                    return {
                        ...nook,
                        lastMessage: lastMessage?.content,
                        lastMessageTime: lastMessage?.timestamp,
                        unreadCount,
                        member_count: memberCount || 0,
                    };
                })
            );

            // Sort: pinned first, then by last activity
            const sortedNooks = nooksWithMessages.sort((a, b) => {
                const aPinned = nookMembers?.find(m => m.nook_id === a.id)?.is_pinned || false;
                const bPinned = nookMembers?.find(m => m.nook_id === b.id)?.is_pinned || false;

                if (aPinned && !bPinned) return -1;
                if (!aPinned && bPinned) return 1;

                return new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime();
            });

            return res.status(200).json({ nooks: sortedNooks });
        } else if (req.method === 'POST') {
            // Create new nook
            const { name, avatar, background, memberIds } = req.body;

            if (!name) {
                return res.status(400).json({ error: 'Nook name is required' });
            }

            // Create nook
            const { data: nook, error: nookError } = await db
                .from('nooks')
                .insert({
                    name,
                    avatar: avatar || null,
                    background: background || null,
                    created_by: decoded.userId,
                    last_activity: new Date().toISOString(),
                })
                .select()
                .single();

            if (nookError) {
                console.error('Error creating nook:', nookError);
                return res.status(500).json({ error: 'Failed to create nook' });
            }

            // Prepare members array - creator + selected friends
            const members = [
                {
                    nook_id: nook.id,
                    user_id: decoded.userId,
                    is_admin: true,
                    is_pinned: false,
                    is_muted: false,
                    is_archived: false,
                }
            ];

            // Add selected friends as members
            if (memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
                const friendMembers = memberIds.map(friendId => ({
                    nook_id: nook.id,
                    user_id: friendId,
                    is_admin: false,
                    is_pinned: false,
                    is_muted: false,
                    is_archived: false,
                }));
                members.push(...friendMembers);
            }

            // Add all members
            const { error: memberError } = await db
                .from('nook_members')
                .insert(members);

            if (memberError) {
                console.error('Error adding members:', memberError);
                // Cleanup nook if member creation fails
                await db.from('nooks').delete().eq('id', nook.id);
                return res.status(500).json({ error: 'Failed to create nook' });
            }

            return res.status(201).json({ nook });
        } else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Error in nooks API:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}


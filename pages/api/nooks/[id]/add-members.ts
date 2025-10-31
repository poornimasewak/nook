import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../../lib/auth';
import { supabase } from '../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { id: nookId } = req.query;
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'User IDs are required' });
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    // Check if the current user is a member of the nook
    const { data: membership, error: membershipError } = await supabase
      .from('nook_members')
      .select('id')
      .eq('nook_id', nookId)
      .eq('user_id', decoded.userId)
      .single();

    if (membershipError || !membership) {
      return res.status(403).json({ error: 'You are not a member of this nook' });
    }

    // Get existing members to avoid duplicates
    const { data: existingMembers } = await supabase
      .from('nook_members')
      .select('user_id')
      .eq('nook_id', nookId);

    const existingUserIds = existingMembers?.map(m => m.user_id) || [];
    
    // Filter out users who are already members
    const newUserIds = userIds.filter(id => !existingUserIds.includes(id));

    if (newUserIds.length === 0) {
      return res.status(400).json({ error: 'All selected users are already members' });
    }

    // Add new members
    const membersToAdd = newUserIds.map(userId => ({
      nook_id: nookId,
      user_id: userId,
      joined_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from('nook_members')
      .insert(membersToAdd);

    if (insertError) {
      console.error('Error adding members:', insertError);
      console.error('Insert details:', {
        nookId,
        newUserIds,
        membersToAdd,
        errorMessage: insertError.message,
        errorDetails: insertError.details,
        errorHint: insertError.hint
      });
      return res.status(500).json({ 
        error: 'Failed to add members. Please try again.' 
      });
    }

    // Get the newly added members' details
    const { data: newMembers } = await supabase
      .from('users')
      .select('id, name, email, display_picture, is_online')
      .in('id', newUserIds);

    return res.status(200).json({ 
      success: true, 
      message: 'Members added successfully',
      addedMembers: newMembers || []
    });
  } catch (error) {
    console.error('Error in add members handler:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


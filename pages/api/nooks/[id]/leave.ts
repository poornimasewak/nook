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

    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    // Remove user from nook_members
    const { error: deleteError } = await supabase
      .from('nook_members')
      .delete()
      .eq('nook_id', nookId)
      .eq('user_id', decoded.userId);

    if (deleteError) {
      console.error('Error leaving nook:', deleteError);
      return res.status(500).json({ error: 'Failed to leave nook' });
    }

    // Check if nook has any remaining members
    const { data: remainingMembers, error: membersError } = await supabase
      .from('nook_members')
      .select('id')
      .eq('nook_id', nookId);

    if (membersError) {
      console.error('Error checking remaining members:', membersError);
    }

    // If no members left, optionally delete the nook
    if (remainingMembers && remainingMembers.length === 0) {
      const { error: deleteNookError } = await supabase
        .from('nooks')
        .delete()
        .eq('id', nookId);

      if (deleteNookError) {
        console.error('Error deleting empty nook:', deleteNookError);
      }
    }

    return res.status(200).json({ success: true, message: 'Left nook successfully' });
  } catch (error) {
    console.error('Error in leave nook handler:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

const { createServer } = require('http');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const PORT = process.env.SOCKET_PORT || 3001;

// Create HTTP server
const httpServer = createServer();

// Create Socket.io server with CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Store online users
const onlineUsers = new Map(); // userId -> { socketId, user }

// Middleware to authenticate socket connections
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.userId;
    socket.userEmail = decoded.email || decoded.phoneNumber; // Try email first, fallback to phoneNumber
    console.log('🔐 Token decoded:', { userId: decoded.userId, email: decoded.email, phoneNumber: decoded.phoneNumber });
    next();
  } catch (err) {
    console.error('❌ Token verification failed:', err.message);
    next(new Error('Invalid token'));
  }
});

io.on('connection', async (socket) => {
  console.log(`✅ User connected: ${socket.userId} (${socket.userEmail})`);

  // Get user details from database
  let userData = null;
  if (supabase) {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, display_picture')
      .eq('id', socket.userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
    } else {
      userData = data;
      console.log('User data fetched:', userData);
    }

    // Update user status to online
    await supabase
      .from('users')
      .update({ 
        is_online: true,
        last_seen: new Date().toISOString()
      })
      .eq('id', socket.userId);
  }

  // Ensure we have at least basic user info with email
  if (!userData || !userData.email) {
    console.log('Creating fallback user data for:', socket.userId);
    userData = { 
      id: socket.userId, 
      email: socket.userEmail || 'unknown@email.com',
      name: socket.userEmail ? socket.userEmail.split('@')[0] : 'User'
    };
  }

  // Ensure the user object has all required fields
  userData = {
    id: userData.id || socket.userId,
    name: userData.name || socket.userEmail?.split('@')[0] || 'User',
    email: userData.email || socket.userEmail || 'unknown@email.com',
    display_picture: userData.display_picture || null,
    is_online: true
  };

  console.log('Final user data to broadcast:', userData);

  // Add to online users
  onlineUsers.set(socket.userId, {
    socketId: socket.id,
    user: userData,
  });

  console.log(`👥 Online users count: ${onlineUsers.size}`);

  // Broadcast updated online users list to all clients
  const usersList = Array.from(onlineUsers.values()).map(u => u.user);
  console.log('📡 Broadcasting online users:', JSON.stringify(usersList, null, 2));
  io.emit('online_users_updated', usersList);

  // Join user's personal room
  socket.join(`user:${socket.userId}`);

  // Handle joining a nook
  socket.on('join_nook', async (nookId) => {
    // Get user info
    const userEntry = onlineUsers.get(socket.userId);
    const userName = userEntry?.user?.name || userData?.name || 'User';
    
    socket.join(`nook:${nookId}`);
    console.log(`👥 User ${socket.userId} (${userName}) joined nook ${nookId}`);

    // Send recent messages from this nook
    if (supabase) {
      const { data: messages } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!sender_id(id, name, email, display_picture)
        `)
        .eq('nook_id', nookId)
        .eq('is_deleted', false)
        .order('timestamp', { ascending: true })
        .limit(50);

      socket.emit('nook_messages', { nookId, messages: messages || [] });
    }

    // Create and broadcast "user joined" system message to others in the nook
    const systemMessage = {
      id: `system-${Date.now()}-${Math.random()}`,
      nook_id: nookId,
      sender_id: 'system',
      message_type: 'system',
      content: `${userName} joined the chat`,
      timestamp: new Date().toISOString(),
      sender: {
        id: 'system',
        name: 'System',
        email: 'system'
      }
    };

    // Broadcast to others in the nook (not to the user who just joined)
    socket.to(`nook:${nookId}`).emit('user_joined_nook', {
      userId: socket.userId,
      userName: userName,
      nookId: nookId,
      message: systemMessage
    });

    console.log(`📢 Broadcasted user joined for ${userName} in nook ${nookId}`);

    // Get all active users in this room and broadcast to everyone
    const socketsInRoom = await io.in(`nook:${nookId}`).fetchSockets();
    const activeUserIds = socketsInRoom.map(s => s.userId).filter(id => id);
    
    io.to(`nook:${nookId}`).emit('active_users_in_room', {
      nookId: nookId,
      activeUserIds: activeUserIds
    });

    console.log(`📡 Broadcasting active users in nook ${nookId}:`, activeUserIds);
  });

  // Handle leaving a nook (when user manually leaves via button)
  socket.on('leave_nook', async (nookId) => {
    // Get user info
    const userEntry = onlineUsers.get(socket.userId);
    const userName = userEntry?.user?.name || userData?.name || 'User';
    
    // Create and broadcast system message BEFORE leaving
    const systemMessage = {
      id: `system-${Date.now()}-${Math.random()}`,
      nook_id: nookId,
      sender_id: 'system',
      message_type: 'system',
      content: `${userName} left the chat`,
      timestamp: new Date().toISOString(),
      sender: {
        id: 'system',
        name: 'System',
        email: 'system'
      }
    };

    // Broadcast to nook room (before leaving the room)
    io.to(`nook:${nookId}`).emit('user_left_nook', {
      userId: socket.userId,
      userName: userName,
      nookId: nookId,
      message: systemMessage
    });

    // Now leave the socket room
    socket.leave(`nook:${nookId}`);
    console.log(`👋 User ${socket.userId} (${userName}) manually left nook ${nookId}`);

    // Get all active users in this room after user left and broadcast
    const socketsInRoom = await io.in(`nook:${nookId}`).fetchSockets();
    const activeUserIds = socketsInRoom.map(s => s.userId).filter(id => id);
    
    io.to(`nook:${nookId}`).emit('active_users_in_room', {
      nookId: nookId,
      activeUserIds: activeUserIds
    });

    console.log(`📡 Broadcasting active users in nook ${nookId} after user left:`, activeUserIds);
  });

  // Handle sending a message
  socket.on('send_message', async (data) => {
    const { nookId, content, messageType = 'text', replyTo = null } = data;

    if (!content || !nookId) {
      socket.emit('error', { message: 'Invalid message data' });
      return;
    }

    try {
      // Save message to database
      let message = null;
      if (supabase) {
        const { data: newMessage, error } = await supabase
          .from('messages')
          .insert({
            nook_id: nookId,
            sender_id: socket.userId,
            message_type: messageType,
            content: content,
            reply_to: replyTo,
            timestamp: new Date().toISOString(),
          })
          .select(`
            *,
            sender:users!sender_id(id, name, email, display_picture)
          `)
          .single();

        if (error) {
          console.error('Error saving message:', error);
          socket.emit('error', { message: 'Failed to send message' });
          return;
        }

        message = newMessage;

        // Update nook's last activity
        await supabase
          .from('nooks')
          .update({ last_activity: new Date().toISOString() })
          .eq('id', nookId);
      } else {
        // Mock message for development
        message = {
          id: `msg-${Date.now()}`,
          nook_id: nookId,
          sender_id: socket.userId,
          message_type: messageType,
          content: content,
          timestamp: new Date().toISOString(),
          sender: userData || { id: socket.userId, email: socket.userEmail, name: 'User' },
        };
      }

      // Broadcast message to all users in the nook
      io.to(`nook:${nookId}`).emit('new_message', message);

      console.log(`💬 Message sent to nook ${nookId} by user ${socket.userId}`);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle username update
  socket.on('update_username', async (data) => {
    const { name } = data;
    
    if (!name || !name.trim()) {
      return;
    }

    console.log(`👤 User ${socket.userId} updated name to: ${name}`);

    // Update user in onlineUsers map
    const userEntry = onlineUsers.get(socket.userId);
    if (userEntry) {
      userEntry.user.name = name;
      onlineUsers.set(socket.userId, userEntry);
    }

    // Update in database
    if (supabase) {
      await supabase
        .from('users')
        .update({ 
          name: name.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', socket.userId);
    }

    // Broadcast updated online users list to ALL clients
    const usersList = Array.from(onlineUsers.values()).map(u => u.user);
    io.emit('online_users_updated', usersList);
    console.log('📡 Broadcasting updated users after name change');
  });

  // Handle typing indicator
  socket.on('typing_start', (data) => {
    const { nookId } = data;
    socket.to(`nook:${nookId}`).emit('user_typing', {
      userId: socket.userId,
      userName: userData?.name || socket.userEmail,
      nookId,
    });
  });

  socket.on('typing_stop', (data) => {
    const { nookId } = data;
    socket.to(`nook:${nookId}`).emit('user_stopped_typing', {
      userId: socket.userId,
      nookId,
    });
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log(`❌ User disconnected: ${socket.userId}`);

    // Get user info before removing
    const userEntry = onlineUsers.get(socket.userId);
    const userName = userEntry?.user?.name || 'User';

    // Get all nook memberships to notify
    if (supabase) {
      const { data: memberships } = await supabase
        .from('nook_members')
        .select('nook_id')
        .eq('user_id', socket.userId);

      // Broadcast "user went offline" message to all nooks they were in
      if (memberships && memberships.length > 0) {
        for (const membership of memberships) {
          const nookId = membership.nook_id;
          
          // Create system message for offline status
          const systemMessage = {
            id: `system-${Date.now()}-${Math.random()}`,
            nook_id: nookId,
            sender_id: 'system',
            message_type: 'system',
            content: `${userName} went offline`,
            timestamp: new Date().toISOString(),
            sender: {
              id: 'system',
              name: 'System',
              email: 'system'
            }
          };

          // Broadcast to nook room
          io.to(`nook:${nookId}`).emit('user_went_offline', {
            userId: socket.userId,
            userName: userName,
            nookId: nookId,
            message: systemMessage
          });

          console.log(`📢 Broadcasted user offline for ${userName} in nook ${nookId}`);

          // Get all active users in this room after disconnect and broadcast
          const socketsInRoom = await io.in(`nook:${nookId}`).fetchSockets();
          const activeUserIds = socketsInRoom.map(s => s.userId).filter(id => id);
          
          io.to(`nook:${nookId}`).emit('active_users_in_room', {
            nookId: nookId,
            activeUserIds: activeUserIds
          });

          console.log(`📡 Broadcasting active users in nook ${nookId} after disconnect:`, activeUserIds);
        }
      }
    }

    // Remove from online users
    onlineUsers.delete(socket.userId);
    console.log(`👥 Online users count after disconnect: ${onlineUsers.size}`);

    // Update user status to offline
    if (supabase) {
      const { error } = await supabase
        .from('users')
        .update({ 
          is_online: false,
          last_seen: new Date().toISOString()
        })
        .eq('id', socket.userId);
      
      if (error) {
        console.error('Error updating user offline status:', error);
      }
    }

    // Broadcast updated online users list to all remaining clients
    const usersList = Array.from(onlineUsers.values()).map(u => u.user);
    io.emit('online_users_updated', usersList);
    console.log('📡 Broadcasting updated online users after disconnect:', usersList);
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Socket.io server running on port ${PORT}`);
  console.log(`📡 Listening for connections from ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
  });
});


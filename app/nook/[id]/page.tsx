'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSocket } from '../../../lib/socket-context';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  message_type: string;
  timestamp: string;
  sender?: {
    id: string;
    name: string;
    email: string;
    display_picture?: string;
  };
}

interface NookMember {
  id: string;
  name: string;
  email: string;
  is_online: boolean;
}

export default function NookChatPage() {
  const router = useRouter();
  const params = useParams();
  const nookId = params.id as string;
  const { socket, isConnected, onlineUsers } = useSocket();
  
  const [user, setUser] = useState<any>(null);
  const [nookName, setNookName] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<NookMember[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [availableFriends, setAvailableFriends] = useState<NookMember[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [addingMembers, setAddingMembers] = useState(false);
  const [activeUsersInRoom, setActiveUsersInRoom] = useState<Set<string>>(new Set());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    loadNookDetails();
  }, [router, nookId]);

  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    // Join the nook
    socket.emit('join_nook', nookId);

    // Listen for messages
    socket.on('nook_messages', (data) => {
      if (data.nookId === nookId) {
        setMessages(data.messages);
        setLoading(false);
      }
    });

    socket.on('new_message', (message) => {
      if (message.nook_id === nookId) {
        setMessages((prev) => [...prev, message]);
      }
    });

    // Listen for user joined notifications
    socket.on('user_joined_nook', (data) => {
      if (data.nookId === nookId && data.message) {
        // Add system message to chat
        setMessages((prev) => [...prev, data.message]);
        
        // Add user to active users
        setActiveUsersInRoom((prev) => new Set([...prev, data.userId]));
        
        // Play door open sound
        playDoorOpenSound();
        
        console.log(`👋 ${data.userName} joined the nook`);
      }
    });

    // Listen for user left notifications (manual leave via button)
    socket.on('user_left_nook', (data) => {
      if (data.nookId === nookId && data.message) {
        // Add system message to chat
        setMessages((prev) => [...prev, data.message]);
        
        // Remove user from active users
        setActiveUsersInRoom((prev) => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
        
        // Play notification sound
        playNotificationSound();
        
        console.log(`👋 ${data.userName} left the nook`);
      }
    });

    // Listen for user went offline (closed app/browser)
    socket.on('user_went_offline', (data) => {
      if (data.nookId === nookId && data.message) {
        // Add system message to chat
        setMessages((prev) => [...prev, data.message]);
        
        // Remove user from active users
        setActiveUsersInRoom((prev) => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
        
        // Play notification sound
        playNotificationSound();
        
        console.log(`📴 ${data.userName} went offline`);
      }
    });

    // Listen for active users in room update
    socket.on('active_users_in_room', (data) => {
      if (data.nookId === nookId) {
        setActiveUsersInRoom(new Set(data.activeUserIds));
        console.log(`👥 Active users in room: ${data.activeUserIds.length}`);
      }
    });

    // Listen for typing indicators
    socket.on('user_typing', (data) => {
      if (data.nookId === nookId && data.userId !== user.id) {
        setIsTyping(data.userName);
      }
    });

    socket.on('user_stopped_typing', (data) => {
      if (data.nookId === nookId) {
        setIsTyping(null);
      }
    });

    return () => {
      socket.emit('leave_nook', nookId);
      socket.off('nook_messages');
      socket.off('new_message');
      socket.off('user_joined_nook');
      socket.off('user_left_nook');
      socket.off('user_went_offline');
      socket.off('active_users_in_room');
      socket.off('user_typing');
      socket.off('user_stopped_typing');
    };
  }, [socket, isConnected, nookId, user]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Update available users when online users or members change
    if (showAddMembers) {
      loadAvailableUsers();
    }
  }, [onlineUsers, members, showAddMembers]);

  const loadNookDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/nooks/${nookId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNookName(data.nook.name);
        setMembers(data.members || []);
        setLoading(false);
      } else {
        console.error('Failed to load nook:', response.status);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading nook details:', error);
      setLoading(false);
    }
  };

  const loadAvailableUsers = () => {
    // Get all online users from socket context
    const memberIds = members.map(m => m.id);
    const currentUserId = user?.id;
    
    // Filter out users who are already members and the current user
    const available = onlineUsers.filter((onlineUser: any) => 
      !memberIds.includes(onlineUser.id) && onlineUser.id !== currentUserId
    );
    
    setAvailableFriends(available);
  };

  const handleAddMembersClick = () => {
    setShowAddMembers(true);
    setSelectedFriends([]);
    loadAvailableUsers();
  };

  const handleAddSingleUser = async (userId: string, userName: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/nooks/${nookId}/add-members`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds: [userId] }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update members list
        if (data.addedMembers && data.addedMembers.length > 0) {
          setMembers([...members, ...data.addedMembers]);
          
          const newMember = data.addedMembers[0];
          
          // Broadcast system message
          if (socket && isConnected) {
            const systemMessage = {
              id: `system-${Date.now()}-${Math.random()}`,
              nook_id: nookId,
              sender_id: 'system',
              message_type: 'system',
              content: `${newMember.name || newMember.email} was added to the chat`,
              timestamp: new Date().toISOString(),
              sender: {
                id: 'system',
                name: 'System',
                email: 'system'
              }
            };
            
            // Add to local messages
            setMessages((prev) => [...prev, systemMessage]);
            
            // Broadcast to others via socket
            socket.emit('send_message', {
              nookId,
              content: systemMessage.content,
              messageType: 'system',
            });
          }
        }
      } else {
        const data = await response.json();
        alert(`Failed to add user: ${data.error}`);
      }
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Failed to add user. Please try again.');
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !socket || !isConnected) return;

    socket.emit('send_message', {
      nookId,
      content: newMessage.trim(),
      messageType: 'text',
    });

    setNewMessage('');
    
    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit('typing_stop', { nookId });
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);

    if (!socket || !isConnected) return;

    // Send typing indicator
    socket.emit('typing_start', { nookId });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { nookId });
    }, 2000);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Play door open sound when user joins
  const playDoorOpenSound = () => {
    try {
      // Create a pleasant "door open" sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configure sound (upward sweep for welcoming feel)
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime); // Start at 400Hz
      oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.3); // Sweep up to 800Hz
      
      gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch (error) {
      console.error('Error playing door open sound:', error);
    }
  };

  // Play notification sound when user leaves
  const playNotificationSound = () => {
    try {
      // Create a simple notification sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configure sound (gentle notification)
      oscillator.frequency.value = 500; // Hz
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  const handleLeaveNook = async () => {
    const confirmLeave = confirm(`Are you sure you want to leave "${nookName}"?`);
    if (!confirmLeave) return;

    try {
      // Emit leave event FIRST to notify other users (while still in room)
      if (socket && isConnected) {
        socket.emit('leave_nook', nookId);
        // Wait a bit for the message to be sent
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Then remove from database
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/nooks/${nookId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Redirect to dashboard
        router.push('/nook');
      } else {
        const data = await response.json();
        alert(`Failed to leave nook: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error leaving nook:', error);
      alert('Failed to leave nook. Please try again.');
    }
  };

  const onlineMembers = members.filter(m => onlineUsers.some(u => u.id === m.id));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-300 via-teal-300 to-orange-300">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-300 via-teal-300 to-orange-300 flex flex-col">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-lg shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/nook')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-yellow-400 flex items-center justify-center text-white font-bold text-xl">
                {nookName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{nookName}</h1>
                <p className="text-sm text-gray-600">{members.length} members • {onlineMembers.length} online</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${isConnected ? 'bg-green-100' : 'bg-gray-100'}`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className={`text-xs font-medium ${isConnected ? 'text-green-700' : 'text-gray-500'}`}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <button
                onClick={() => setShowMembers(!showMembers)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
                title="View members"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {onlineMembers.length > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">
                    {onlineMembers.length}
                  </span>
                )}
              </button>

              <button
                onClick={handleAddMembersClick}
                className="p-2 hover:bg-teal-50 rounded-full transition-colors bg-teal-100"
                title="Add members"
              >
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              
              <button
                onClick={handleLeaveNook}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-semibold text-sm flex items-center gap-2"
                title="Leave this nook"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Leave Nook
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col bg-white/95 backdrop-blur-lg m-4 rounded-3xl shadow-2xl overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            {messages.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No messages yet</h3>
                <p className="text-gray-500">Start the conversation!</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isSystemMessage = message.sender_id === 'system' || message.message_type === 'system';
                const isOwnMessage = message.sender_id === user?.id;
                const showDate = index === 0 || formatDate(message.timestamp) !== formatDate(messages[index - 1].timestamp);
                const isSenderActive = isOwnMessage || activeUsersInRoom.has(message.sender_id);
                const shouldBlur = !isSystemMessage && !isSenderActive;
                
                return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="flex justify-center my-4">
                        <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                          {formatDate(message.timestamp)}
                        </span>
                      </div>
                    )}
                    
                    {isSystemMessage ? (
                      // System message (user left/joined/added)
                      <div className="flex justify-center my-3">
                        {message.content.includes('joined') ? (
                          // User joined - green styling
                          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded-full flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                            <span className="text-sm font-medium">{message.content}</span>
                            <span className="text-xs text-green-600">{formatTime(message.timestamp)}</span>
                          </div>
                        ) : message.content.includes('was added') ? (
                          // User was added - blue styling
                          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-full flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            <span className="text-sm font-medium">{message.content}</span>
                            <span className="text-xs text-blue-600">{formatTime(message.timestamp)}</span>
                          </div>
                        ) : message.content.includes('went offline') ? (
                          // User went offline - red/orange styling
                          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded-full flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                            </svg>
                            <span className="text-sm font-medium">{message.content}</span>
                            <span className="text-xs text-red-600">{formatTime(message.timestamp)}</span>
                          </div>
                        ) : (
                          // User left - yellow styling
                          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-full flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="text-sm font-medium">{message.content}</span>
                            <span className="text-xs text-yellow-600">{formatTime(message.timestamp)}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      // Regular message
                      <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${shouldBlur ? 'relative' : ''}`}>
                        <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'} ${shouldBlur ? 'blur-md select-none pointer-events-none' : ''}`}>
                          {!isOwnMessage && (
                            <p className={`text-xs text-gray-500 mb-1 ml-3`}>
                              {message.sender?.name || message.sender?.email || 'Unknown User'}
                            </p>
                          )}
                          <div
                            className={`rounded-2xl px-4 py-3 ${
                              isOwnMessage
                                ? 'bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-br-sm'
                                : shouldBlur 
                                  ? 'bg-gray-200 text-gray-600 rounded-bl-sm'
                                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                            }`}
                          >
                            <p className="break-words">{message.content}</p>
                            <p className={`text-xs mt-1 ${isOwnMessage ? 'text-white/70' : 'text-gray-500'}`}>
                              {formatTime(message.timestamp)}
                            </p>
                          </div>
                        </div>
                        {shouldBlur && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-gray-800/80 text-white px-3 py-1 rounded-full text-xs font-semibold">
                              User has left
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3 rounded-bl-sm">
                  <p className="text-sm text-gray-600">{isTyping} is typing...</p>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-6 border-t border-gray-200 bg-white">
            <div className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => handleTyping(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                disabled={!isConnected}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || !isConnected}
                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                Send
              </button>
            </div>
          </form>
        </div>

        {/* Members Sidebar */}
        {showMembers && (
          <div className="w-80 bg-white/95 backdrop-blur-lg m-4 ml-0 rounded-3xl shadow-2xl p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Members ({members.length})</h2>
            <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]">
              {members.map((member) => {
                const isOnline = onlineUsers.some(u => u.id === member.id);
                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-green-400 flex items-center justify-center text-white font-bold">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      {isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                    {isOnline && (
                      <span className="text-xs text-green-600 font-semibold">● Online</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add Members Modal */}
      {showAddMembers && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Add Members</h2>
              <button
                onClick={() => setShowAddMembers(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {availableFriends.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-gray-600 font-medium">No online users available</p>
                <p className="text-sm text-gray-500 mt-2">All online users are already members of this nook.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Click on a user to add them to this nook:
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                    {availableFriends.length} online
                  </span>
                </p>
                <div className="space-y-2 mb-4 max-h-[400px] overflow-y-auto">
                  {availableFriends.map((friend) => {
                    const isAdding = addingMembers && selectedFriends.includes(friend.id);
                    
                    return (
                      <button
                        key={friend.id}
                        onClick={async () => {
                          setSelectedFriends([friend.id]); // Set for loading state
                          setAddingMembers(true);
                          await handleAddSingleUser(friend.id, friend.name || friend.email);
                          setAddingMembers(false);
                          setSelectedFriends([]);
                        }}
                        disabled={addingMembers}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                          addingMembers
                            ? 'opacity-50 cursor-not-allowed'
                            : 'bg-white hover:bg-teal-50 border-2 border-gray-200 hover:border-teal-400'
                        }`}
                      >
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-green-400 flex items-center justify-center text-white font-bold">
                            {(friend.name || friend.email).charAt(0).toUpperCase()}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-gray-800">{friend.name || friend.email}</p>
                          <p className="text-xs text-gray-500">{friend.email}</p>
                        </div>
                        {isAdding ? (
                          <svg className="animate-spin h-5 w-5 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setShowAddMembers(false)}
                    className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


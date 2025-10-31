'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '../../lib/socket-context';

interface Friend {
  id: string;
  name: string;
  email: string;
  display_picture?: string;
  is_online: boolean;
}

interface Nook {
  id: string;
  name: string;
  avatar?: string;
  background?: string;
  last_activity: string;
  member_count: number;
}

export default function YourNookPage() {
  const router = useRouter();
  const { socket, isConnected, onlineUsers } = useSocket();
  const [activeTab, setActiveTab] = useState<'friends' | 'nooks' | 'create'>('friends');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [nooks, setNooks] = useState<Nook[]>([]);
  const [newNookName, setNewNookName] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showNameEdit, setShowNameEdit] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    setLoading(false);

    // Load friends and nooks
    loadFriends();
    loadNooks();
  }, [router]);

  const loadFriends = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/friends', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFriends(data.friends || []);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadNooks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/nooks', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNooks(data.nooks || []);
      }
    } catch (error) {
      console.error('Error loading nooks:', error);
    }
  };

  const handleCreateNook = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setError('');
    setSuccess('');

    if (!newNookName.trim()) {
      setError('Please enter a nook name');
      setCreateLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/nooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newNookName,
          memberIds: selectedFriends,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newNookId = data.nook.id;
        
        setSuccess('Nook created! Opening chat... 🎉');
        
        // Redirect to the chat page for the new nook
        setTimeout(() => {
          router.push(`/nook/${newNookId}`);
        }, 1000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create nook');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Error creating nook:', error);
    } finally {
      setCreateLoading(false);
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      setError('Please enter a name');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newName }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update local state
        const updatedUser = { ...user, name: newName };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setShowNameEdit(false);
        setSuccess('Name updated! ✅');
        
        // Notify Socket.io server about the name change
        if (socket && isConnected) {
          socket.emit('update_username', { name: newName });
          console.log('📡 Sent username update to Socket.io server');
        }
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to update name');
      }
    } catch (error) {
      setError('Error updating name');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Get online friends from socket connection
  const onlineFriends = onlineUsers.filter(u => u.id !== user?.id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-300 via-teal-300 to-orange-300">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-300 via-teal-300 to-orange-300 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 via-green-400 to-orange-400 flex items-center justify-center shadow-lg relative">
                <span className="text-2xl font-bold text-white">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
                {isConnected && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-800">Welcome, {user?.name}! 👋</h1>
                  <button
                    onClick={() => {
                      setShowNameEdit(!showNameEdit);
                      setNewName(user?.name || '');
                    }}
                    className="text-teal-600 hover:text-teal-700"
                    title="Edit name"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
                {showNameEdit && (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Enter your name"
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                    />
                    <button
                      onClick={handleUpdateName}
                      className="px-3 py-1 bg-teal-500 text-white rounded-lg text-sm hover:bg-teal-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setShowNameEdit(false)}
                      className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                <p className="text-gray-600">{user?.email}</p>
                <p className={`text-xs ${isConnected ? 'text-green-600' : 'text-gray-400'}`}>
                  {isConnected ? '● Connected' : '○ Disconnected'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors font-semibold"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden">
          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('friends')}
                className={`flex-1 px-6 py-4 text-center font-semibold transition-all ${
                  activeTab === 'friends'
                    ? 'bg-gradient-to-r from-teal-500 to-green-500 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Online Friends
                  {onlineFriends.length > 0 && (
                    <span className="bg-white/30 px-2 py-0.5 rounded-full text-xs">
                      {onlineFriends.length}
                    </span>
                  )}
                </div>
              </button>

              <button
                onClick={() => setActiveTab('nooks')}
                className={`flex-1 px-6 py-4 text-center font-semibold transition-all ${
                  activeTab === 'nooks'
                    ? 'bg-gradient-to-r from-teal-500 to-green-500 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  My Nooks
                  {nooks.length > 0 && (
                    <span className="bg-white/30 px-2 py-0.5 rounded-full text-xs">
                      {nooks.length}
                    </span>
                  )}
                </div>
              </button>

              <button
                onClick={() => setActiveTab('create')}
                className={`flex-1 px-6 py-4 text-center font-semibold transition-all ${
                  activeTab === 'create'
                    ? 'bg-gradient-to-r from-teal-500 to-green-500 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create New Nook
                </div>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8 min-h-[500px]">
            {/* Online Friends Tab */}
            {activeTab === 'friends' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Online Friends</h2>
                {onlineFriends.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No friends online</h3>
                    <p className="text-gray-500">Your friends will appear here when they're online</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {onlineFriends.map((friend) => {
                      const displayName = friend.name || friend.email || 'Unknown User';
                      return (
                        <div
                          key={friend.id}
                          className="bg-gradient-to-br from-teal-50 to-green-50 p-6 rounded-2xl border-2 border-teal-200 hover:shadow-lg transition-shadow"
                        >
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-green-400 flex items-center justify-center text-white font-bold text-lg">
                                {displayName.charAt(0).toUpperCase()}
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-800">{displayName}</h3>
                              <p className="text-sm text-gray-600">{friend.email || 'No email'}</p>
                              <span className="inline-block mt-1 text-xs text-green-600 font-semibold">● Online</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* My Nooks Tab */}
            {activeTab === 'nooks' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">My Nooks</h2>
                {nooks.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No nooks yet</h3>
                    <p className="text-gray-500 mb-4">Create your first nook to start chatting with friends!</p>
                    <button
                      onClick={() => setActiveTab('create')}
                      className="px-6 py-3 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-xl font-semibold hover:from-teal-600 hover:to-green-600 transition-all"
                    >
                      Create Your First Nook
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {nooks.map((nook) => (
                      <div
                        key={nook.id}
                        onClick={() => router.push(`/nook/${nook.id}`)}
                        className="bg-gradient-to-br from-orange-50 to-yellow-50 p-6 rounded-2xl border-2 border-orange-200 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-yellow-400 flex items-center justify-center text-white font-bold text-xl">
                            {nook.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-800 text-lg mb-1">{nook.name}</h3>
                            <p className="text-sm text-gray-600 mb-2">{nook.member_count} members</p>
                            <p className="text-xs text-gray-500">
                              Last active: {new Date(nook.last_activity).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-teal-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Create New Nook Tab */}
            {activeTab === 'create' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Nook</h2>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-600 text-center">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-green-600 text-center">{success}</p>
                  </div>
                )}

                <form onSubmit={handleCreateNook} className="max-w-2xl mx-auto">
                  {/* Nook Name */}
                  <div className="mb-6">
                    <label htmlFor="nookName" className="block text-sm font-semibold text-gray-700 mb-3">
                      Nook Name
                    </label>
                    <input
                      type="text"
                      id="nookName"
                      value={newNookName}
                      onChange={(e) => setNewNookName(e.target.value)}
                      placeholder="e.g., Study Group, Family Chat, Weekend Plans"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  {/* Select Online Users */}
                  <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Add People (from online users)
                    </label>
                    {onlineFriends.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-xl">
                        <p className="text-gray-500">No one else is online right now!</p>
                        <p className="text-xs text-gray-400 mt-2">You can still create the nook and add people later</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto bg-gray-50 rounded-xl p-4">
                        {onlineFriends.map((person) => {
                          const displayName = person.name || person.email || 'Unknown User';
                          return (
                            <label
                              key={person.id}
                              className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all ${
                                selectedFriends.includes(person.id)
                                  ? 'bg-teal-100 border-2 border-teal-400'
                                  : 'bg-white border-2 border-gray-200 hover:border-teal-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedFriends.includes(person.id)}
                                onChange={() => toggleFriendSelection(person.id)}
                                className="w-5 h-5 text-teal-500 focus:ring-teal-400 rounded"
                              />
                              <div className="flex items-center gap-3 flex-1">
                                <div className="relative">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-green-400 flex items-center justify-center text-white font-bold">
                                    {displayName.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800">{displayName}</p>
                                  <p className="text-xs text-gray-500">{person.email || 'No email'}</p>
                                </div>
                                <span className="ml-auto text-xs text-green-600 font-semibold">● Online</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    {selectedFriends.length > 0 && (
                      <p className="mt-2 text-sm text-gray-600">
                        {selectedFriends.length} friend{selectedFriends.length !== 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>

                  {/* Create Button */}
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="w-full bg-gradient-to-r from-teal-500 via-green-500 to-orange-500 hover:from-teal-600 hover:via-green-600 hover:to-orange-600 text-white font-semibold py-4 px-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                  >
                    {createLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </span>
                    ) : (
                      'Create Nook 🎉'
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


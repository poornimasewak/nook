'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: number;
  username: string;
  text: string;
  timestamp: string;
  avatar: string;
  status: 'sent' | 'delivered' | 'read';
}

export default function ChatRoom() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      username: 'Alice',
      text: 'Hey everyone! Welcome to the chat room 👋',
      timestamp: '10:30 AM',
      avatar: 'AL',
      status: 'read',
    },
    {
      id: 2,
      username: 'Bob',
      text: 'Thanks! Excited to be here',
      timestamp: '10:32 AM',
      avatar: 'BO',
      status: 'read',
    },
    {
      id: 3,
      username: 'Charlie',
      text: 'This is a great platform for discussions',
      timestamp: '10:35 AM',
      avatar: 'CH',
      status: 'delivered',
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [onlineUsers] = useState(4);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Simulate message status updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMessages((prevMessages) =>
        prevMessages.map((msg, idx) => {
          if (idx === prevMessages.length - 1 && msg.status === 'sent') {
            return { ...msg, status: 'delivered' };
          } else if (idx === prevMessages.length - 1 && msg.status === 'delivered') {
            return { ...msg, status: 'read' };
          }
          return msg;
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      const newMessage: Message = {
        id: messages.length + 1,
        username: 'You',
        text: inputMessage,
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        }),
        avatar: 'YO',
        status: 'sent',
      };
      setMessages([...messages, newMessage]);
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getAvatarColor = (username: string) => {
    const colors = [
      'bg-pink-400',
      'bg-cyan-400',
      'bg-blue-500',
      'bg-purple-500',
      'bg-green-500',
      'bg-orange-500',
      'bg-red-500',
      'bg-indigo-500',
    ];
    const index = username.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const MessageStatus = ({ status }: { status: string }) => {
    if (status === 'sent') {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    } else if (status === 'delivered') {
      return (
        <div className="relative w-4 h-4">
          <svg className="absolute w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <svg className="absolute w-4 h-4 text-gray-400 translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    } else if (status === 'read') {
      return (
        <div className="relative w-4 h-4">
          <svg className="absolute w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <svg className="absolute w-4 h-4 text-blue-500 translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-cyan-400 via-teal-400 to-orange-400 p-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎨</span>
              <h1 className="text-2xl font-bold text-white">Colorful Chat Room</h1>
            </div>
            <p className="text-white/90 mt-1">Connect and chat with vibrant colors</p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-white font-semibold">{onlineUsers} online</span>
          </div>
        </div>
      </header>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-6xl mx-auto w-full">
        <div className="space-y-6">
          {messages.map((message) => (
            <div key={message.id} className="flex items-start gap-4 animate-fadeIn">
              {/* Avatar */}
              <div
                className={`${getAvatarColor(message.username)} w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0`}
              >
                {message.avatar}
              </div>

              {/* Message Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-800">{message.username}</span>
                  <span className="text-sm text-gray-500">{message.timestamp}</span>
                </div>
                <div className="flex items-end gap-2">
                  <div className="bg-gradient-to-r from-cyan-100 to-teal-100 rounded-2xl rounded-tl-sm px-5 py-3 shadow-sm">
                    <p className="text-gray-800">{message.text}</p>
                  </div>
                  {message.username === 'You' && <MessageStatus status={message.status} />}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="border-t bg-white p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex gap-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-6 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent bg-gray-50"
          />
          <button
            onClick={handleSendMessage}
            className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}



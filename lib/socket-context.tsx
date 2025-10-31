'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    onlineUsers: any[];
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    onlineUsers: [],
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

    useEffect(() => {
        // Get token from localStorage
        const token = localStorage.getItem('token');

        if (!token) {
            return;
        }

        // Connect to Socket.io server
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
        const newSocket = io(socketUrl, {
            auth: {
                token,
            },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        newSocket.on('connect', () => {
            console.log('✅ Connected to Socket.io server');
            console.log('Socket ID:', newSocket.id);
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('❌ Disconnected from Socket.io server');
            setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('❌ Socket.io Connection error:', error.message);
            console.error('Make sure Socket.io server is running on port 3001');
            setIsConnected(false);
        });

        // Listen for online users updates
        newSocket.on('online_users_updated', (users) => {
            console.log('📡 Online users updated. Count:', users.length);
            console.log('📡 RAW Online users data:', JSON.stringify(users, null, 2));
            console.table(users); // Show in table format
            setOnlineUsers(users);
        });

        setSocket(newSocket);

        // Cleanup on unmount
        return () => {
            newSocket.close();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
}


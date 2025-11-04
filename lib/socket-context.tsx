'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    onlineUsers: any[];
    connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    onlineUsers: [],
    connectionState: 'disconnected',
});

export const useSocket = () => useContext(SocketContext);

// Prefix for easy filtering in console
const LOG_PREFIX = '[NOOK Socket]';

export function SocketProvider({ children }: { children: React.ReactNode }) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
    const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'>('disconnected');

    useEffect(() => {
        // Get token from localStorage
        const token = localStorage.getItem('token');

        if (!token) {
            console.log(`${LOG_PREFIX} ⚠️ No token found, skipping socket connection`);
            return;
        }

        // Connect to Socket.io server
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
        console.log(`${LOG_PREFIX} 🔌 Initializing connection to ${socketUrl}`);

        setConnectionState('connecting');

        const newSocket = io(socketUrl, {
            auth: {
                token,
            },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 10000,
        });

        // Connection successful
        newSocket.on('connect', () => {
            console.log(`${LOG_PREFIX} ✅ Connected successfully`);
            console.log(`${LOG_PREFIX} Socket ID: ${newSocket.id}`);
            console.log(`${LOG_PREFIX} Transport: ${newSocket.io.engine.transport.name}`);
            setIsConnected(true);
            setConnectionState('connected');
        });

        // Disconnected from server
        newSocket.on('disconnect', (reason) => {
            console.log(`${LOG_PREFIX} ❌ Disconnected from server`);
            console.log(`${LOG_PREFIX} Reason: ${reason}`);
            setIsConnected(false);
            setConnectionState('disconnected');
        });

        // Connection error
        newSocket.on('connect_error', (error) => {
            console.error(`${LOG_PREFIX} ❌ Connection error:`, error.message);
            console.error(`${LOG_PREFIX} Server URL: ${socketUrl}`);
            console.error(`${LOG_PREFIX} Tip: Make sure your backend Socket.io server is running`);
            setIsConnected(false);
            setConnectionState('error');
        });

        // Reconnection attempt
        newSocket.io.on('reconnect_attempt', (attempt) => {
            console.log(`${LOG_PREFIX} 🔄 Reconnection attempt ${attempt}/5`);
            setConnectionState('reconnecting');
        });

        // Reconnection successful
        newSocket.io.on('reconnect', (attempt) => {
            console.log(`${LOG_PREFIX} ✅ Reconnected after ${attempt} attempts`);
            setConnectionState('connected');
        });

        // Reconnection failed
        newSocket.io.on('reconnect_failed', () => {
            console.error(`${LOG_PREFIX} ❌ Reconnection failed after 5 attempts`);
            console.error(`${LOG_PREFIX} Please refresh the page or check your connection`);
            setConnectionState('error');
        });

        // Reconnection error
        newSocket.io.on('reconnect_error', (error) => {
            console.error(`${LOG_PREFIX} ❌ Reconnection error:`, error.message);
        });

        // Listen for online users updates
        newSocket.on('online_users_updated', (users) => {
            console.log(`${LOG_PREFIX} 📡 Online users updated. Count: ${users.length}`);
            console.log(`${LOG_PREFIX} 📡 Users:`, users);
            setOnlineUsers(users);
        });

        // Generic error handler
        newSocket.on('error', (error) => {
            console.error(`${LOG_PREFIX} ❌ Socket error:`, error);
        });

        setSocket(newSocket);

        // Cleanup on unmount
        return () => {
            console.log(`${LOG_PREFIX} 🔌 Cleaning up socket connection`);
            newSocket.removeAllListeners();
            newSocket.close();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected, onlineUsers, connectionState }}>
            {children}
        </SocketContext.Provider>
    );
}


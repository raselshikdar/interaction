'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store';

interface NewMessageEvent {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  read: boolean;
}

interface NewNotificationEvent {
  id: string;
  type: string;
  actorId: string;
  postId?: string;
  createdAt: string;
  read: boolean;
}

interface TypingEvent {
  userId: string;
  isTyping: boolean;
}

interface MessagesReadEvent {
  byUserId: string;
  readAt: string;
}

export function useRealtime() {
  const { user, token } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Message handlers
  const onNewMessageRef = useRef<((message: NewMessageEvent) => void) | null>(null);
  const onNewNotificationRef = useRef<((notification: NewNotificationEvent) => void) | null>(null);
  const onTypingRef = useRef<((event: TypingEvent) => void) | null>(null);
  const onMessagesReadRef = useRef<((event: MessagesReadEvent) => void) | null>(null);

  // Connect to WebSocket
  useEffect(() => {
    if (!user?.id) return;

    // Connect to WebSocket server
    const socket = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Connected to real-time server');
      setIsConnected(true);
      
      // Authenticate with userId
      socket.emit('authenticate', { userId: user.id });
    });

    socket.on('authenticated', (data) => {
      console.log('✅ Authenticated:', data.message);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from real-time server');
      setIsConnected(false);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Listen for new messages
    socket.on('new_message', (message: NewMessageEvent) => {
      console.log('📨 New message received:', message.id);
      if (onNewMessageRef.current) {
        onNewMessageRef.current(message);
      }
    });

    // Listen for new notifications
    socket.on('new_notification', (notification: NewNotificationEvent) => {
      console.log('🔔 New notification received:', notification.id);
      if (onNewNotificationRef.current) {
        onNewNotificationRef.current(notification);
      }
    });

    // Listen for typing events
    socket.on('user_typing', (event: TypingEvent) => {
      if (onTypingRef.current) {
        onTypingRef.current(event);
      }
    });

    // Listen for messages read events
    socket.on('messages_read', (event: MessagesReadEvent) => {
      console.log('✉️ Messages read by:', event.byUserId);
      if (onMessagesReadRef.current) {
        onMessagesReadRef.current(event);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  // Set message handler
  const onNewMessage = useCallback((handler: (message: NewMessageEvent) => void) => {
    onNewMessageRef.current = handler;
  }, []);

  // Set notification handler
  const onNewNotification = useCallback((handler: (notification: NewNotificationEvent) => void) => {
    onNewNotificationRef.current = handler;
  }, []);

  // Set typing handler
  const onTyping = useCallback((handler: (event: TypingEvent) => void) => {
    onTypingRef.current = handler;
  }, []);

  // Set messages read handler
  const onMessagesRead = useCallback((handler: (event: MessagesReadEvent) => void) => {
    onMessagesReadRef.current = handler;
  }, []);

  // Send a message
  const sendMessage = useCallback((data: {
    messageId: string;
    senderId: string;
    receiverId: string;
    content: string;
    imageUrl?: string;
    createdAt: string;
  }) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('send_message', data);
    }
  }, [isConnected]);

  // Send a notification
  const sendNotification = useCallback((data: {
    notificationId: string;
    userId: string;
    type: string;
    actorId: string;
    postId?: string;
    createdAt: string;
  }) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('send_notification', data);
    }
  }, [isConnected]);

  // Start typing indicator
  const startTyping = useCallback((senderId: string, receiverId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing_start', { senderId, receiverId });
    }
  }, [isConnected]);

  // Stop typing indicator
  const stopTyping = useCallback((senderId: string, receiverId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing_stop', { senderId, receiverId });
    }
  }, [isConnected]);

  // Mark messages as read
  const markMessagesRead = useCallback((userId: string, partnerId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('mark_messages_read', { userId, partnerId });
    }
  }, [isConnected]);

  return {
    isConnected,
    onNewMessage,
    onNewNotification,
    onTyping,
    onMessagesRead,
    sendMessage,
    sendNotification,
    startTyping,
    stopTyping,
    markMessagesRead
  };
}

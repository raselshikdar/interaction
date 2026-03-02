'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store';
import { useUnreadStore } from '@/store/unread';
import { useRealtime } from '@/hooks/useRealtime';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { User, Message } from '@/types';
import { 
  MessageCircle, Plus, Send, Settings, ArrowLeft, Search, X, 
  Image as ImageIcon, Check, CheckCheck, MoreVertical, Phone, Video,
  Smile, Paperclip, Mic
} from 'lucide-react';
import { formatDistanceToNow, format, isToday, isYesterday, isSameDay } from 'date-fns';

interface Conversation {
  partner: User;
  lastMessage: Message;
  unreadCount: number;
}

// Format timestamp for messages
function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  if (isToday(date)) {
    return format(date, 'h:mm a');
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else {
    return format(date, 'MMM d');
  }
}

// Format timestamp for chat messages
function formatChatTime(dateString: string): string {
  const date = new Date(dateString);
  if (isToday(date)) {
    return format(date, 'h:mm a');
  } else {
    return format(date, 'MMM d, h:mm a');
  }
}

// Conversation Skeleton
function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 border-b border-border animate-pulse">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

// Message Skeleton
function MessageSkeleton() {
  return (
    <div className="flex gap-2 p-3 animate-pulse">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-10 w-3/4 rounded-xl" />
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
        <MessageCircle className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Nothing here</h2>
      <p className="text-muted-foreground text-sm max-w-xs">
        You don&apos;t have any conversations yet. Start a new conversation by tapping the button below.
      </p>
    </div>
  );
}

// New Conversation Modal
interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: User) => void;
}

function NewConversationModal({ isOpen, onClose, onSelectUser }: NewConversationModalProps) {
  const { token, user: currentUser } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && searchQuery.length > 0) {
      const searchUsers = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setUsers(data.users.filter((u: User) => u.id !== currentUser?.id));
          }
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      const debounce = setTimeout(searchUsers, 300);
      return () => clearTimeout(debounce);
    } else {
      setUsers([]);
    }
  }, [isOpen, searchQuery, token, currentUser]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">New Conversation</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {isLoading ? (
            <>
              <ConversationSkeleton />
              <ConversationSkeleton />
              <ConversationSkeleton />
            </>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {searchQuery.length > 0 ? 'No users found' : 'Type to search for users'}
            </div>
          ) : (
            users.map((user) => (
              <button
                key={user.id}
                className="flex items-center gap-3 w-full p-4 hover:bg-muted/50 transition-colors text-left"
                onClick={() => {
                  onSelectUser(user);
                  onClose();
                  setSearchQuery('');
                }}
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback>{(user.displayName || user.handle)[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{user.displayName || user.handle}</p>
                  <p className="text-sm text-muted-foreground truncate">@{user.handle}</p>
                </div>
              </button>
            ))
          )}
        </ScrollArea>
      </Card>
    </div>
  );
}

// Conversations List View
interface ConversationsListProps {
  conversations: Conversation[];
  isLoading: boolean;
  onSelectConversation: (partner: User) => void;
  onNewConversation: () => void;
}

function ConversationsList({ 
  conversations, 
  isLoading, 
  onSelectConversation,
  onNewConversation 
}: ConversationsListProps) {
  return (
    <div className="h-full flex flex-col bg-background">
      <header className="sticky top-0 z-20 flex items-center justify-between h-14 px-4 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="p-2 -ml-2 rounded-full hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="font-semibold text-[17px] text-foreground">Messages</h1>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent" asChild>
          <Link href="/settings">
            <Settings className="h-5 w-5 text-foreground" />
          </Link>
        </Button>
      </header>

      {/* Conversations List or Empty State */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <>
            <ConversationSkeleton />
            <ConversationSkeleton />
            <ConversationSkeleton />
            <ConversationSkeleton />
          </>
        ) : conversations.length === 0 ? (
          <EmptyState />
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.partner.id}
              className="flex items-center gap-3 w-full p-4 hover:bg-accent transition-colors text-left border-b border-border"
              onClick={() => onSelectConversation(conv.partner)}
            >
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={conv.partner.avatar || undefined} />
                  <AvatarFallback>
                    {(conv.partner.displayName || conv.partner.handle)[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={cn(
                    "font-semibold truncate",
                    conv.unreadCount > 0 ? "text-foreground" : "text-foreground"
                  )}>
                    {conv.partner.displayName || conv.partner.handle}
                  </p>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {formatMessageTime(conv.lastMessage.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className={cn(
                    "text-sm truncate",
                    conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                  )}>
                    {conv.lastMessage.senderId === conv.partner.id ? '' : 'You: '}
                    {conv.lastMessage.content || '📷 Photo'}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span className="min-w-[20px] h-5 bg-[#0085ff] text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1.5">
                      {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </ScrollArea>

      {/* Floating Action Button */}
      <Button
        className="fixed bottom-20 right-4 md:bottom-8 rounded-full h-14 w-14 shadow-lg bg-[#0085ff] hover:bg-[#0070e0]"
        size="icon"
        onClick={onNewConversation}
      >
        <Plus className="h-6 w-6 text-white" />
      </Button>
    </div>
  );
}

// Typing Indicator Component
function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-xs text-gray-400">typing...</span>
    </div>
  );
}

// Chat View Component - WhatsApp/Messenger style
interface ChatViewProps {
  partner: User;
  messages: Message[];
  isLoading: boolean;
  onBack: () => void;
  onSendMessage: (content: string, imageUrl?: string) => void;
  isSending: boolean;
  isTyping: boolean;
}

function ChatView({ 
  partner, 
  messages, 
  isLoading, 
  onBack, 
  onSendMessage,
  isSending,
  isTyping
}: ChatViewProps) {
  const [inputValue, setInputValue] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user: currentUser } = useAuthStore();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = () => {
    if ((inputValue.trim() || imageUrl) && !isSending) {
      onSendMessage(inputValue.trim(), imageUrl || undefined);
      setInputValue('');
      setImageUrl(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const groupedMessages: { date: Date; messages: Message[] }[] = [];
  messages.forEach(msg => {
    const msgDate = new Date(msg.createdAt);
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    
    if (lastGroup && isSameDay(lastGroup.date, msgDate)) {
      lastGroup.messages.push(msg);
    } else {
      groupedMessages.push({ date: msgDate, messages: [msg] });
    }
  });

  // Format date separator
  const formatDateSeparator = (date: Date): string => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header - WhatsApp style */}
      <header className="sticky top-0 z-20 flex items-center gap-2 h-14 px-2 bg-[#0085ff] text-white">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 rounded-full hover:bg-white/10 text-white">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Link 
              href={`/profile/${partner.handle}`}
          className="flex items-center gap-2 flex-1 min-w-0"
        >
          <Avatar className="h-9 w-9 border-2 border-white/20">
            <AvatarImage src={partner.avatar || undefined} />
            <AvatarFallback>
              {(partner.displayName || partner.handle)[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold truncate text-white">{partner.displayName || partner.handle}</p>
            <p className="text-xs text-white/70 truncate">@{partner.handle}</p>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 text-white">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 text-white">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 text-white">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-2" ref={scrollRef}>
        {isLoading ? (
          <>
            <MessageSkeleton />
            <MessageSkeleton />
            <MessageSkeleton />
          </>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground px-4">
            <div className="w-16 h-16 rounded-full bg-[#0085ff]/10 flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-[#0085ff]" />
            </div>
            <p className="font-medium text-gray-700">No messages yet</p>
            <p className="text-sm text-gray-500">Send a message to start the conversation</p>
          </div>
        ) : (
          <div className="space-y-1">
            {groupedMessages.map((group, groupIndex) => (
              <div key={groupIndex}>
                {/* Date Separator */}
                <div className="flex justify-center py-4">
                  <span className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full shadow-sm">
                    {formatDateSeparator(group.date)}
                  </span>
                </div>
                
                {/* Messages in this group */}
                {group.messages.map((message, msgIndex) => {
                  const isOwnMessage = message.senderId === currentUser?.id;
                  const showAvatar = !isOwnMessage && (
                    msgIndex === group.messages.length - 1 || 
                    group.messages[msgIndex + 1]?.senderId !== message.senderId
                  );
                  
                  return (
                    <div
                      key={message.id}
                      className={cn(
                        'flex gap-1.5 mb-1',
                        isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                      )}
                    >
                      {/* Avatar placeholder for alignment */}
                      {!isOwnMessage && (
                        <div className="w-7 h-7 shrink-0">
                          {showAvatar && (
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={partner.avatar || undefined} />
                              <AvatarFallback className="text-[10px]">
                                {(partner.displayName || partner.handle)[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      )}
                      
                      {/* Message Bubble */}
                      <div className={cn(
                        'max-w-[75%] flex flex-col',
                        isOwnMessage ? 'items-end' : 'items-start'
                      )}>
                        <div className={cn(
                          'px-3 py-1.5 rounded-2xl shadow-sm',
                          isOwnMessage 
                            ? 'bg-[#0085ff] text-white rounded-tr-sm' 
                            : 'bg-card text-foreground rounded-tl-sm'
                        )}>
                          {/* Image if exists */}
                          {message.imageUrl && (
                            <img 
                              src={message.imageUrl} 
                              alt={message.imageAlt || 'Image'} 
                              className="max-w-full rounded-lg mb-1 max-h-60 object-cover"
                            />
                          )}
                          {/* Text content */}
                          {message.content && (
                            <p className="whitespace-pre-wrap break-words text-[15px]">{message.content}</p>
                          )}
                          {/* Timestamp and Read Status */}
                          <div className={cn(
                            'flex items-center justify-end gap-1 mt-0.5',
                            isOwnMessage ? 'text-white/70' : 'text-gray-400'
                          )}>
                            <span className="text-[10px]">
                              {format(new Date(message.createdAt), 'h:mm a')}
                            </span>
                            {isOwnMessage && (
                              message.read ? (
                                <CheckCheck className="h-3.5 w-3.5 text-white/90" />
                              ) : (
                                <Check className="h-3.5 w-3.5 text-white/70" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-1.5 mb-1">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={partner.avatar || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {(partner.displayName || partner.handle)[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="bg-card px-3 py-2 rounded-2xl rounded-tl-sm shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input Area - WhatsApp style */}
        <div className="border-t border-border p-2 bg-muted">
        {/* Image preview */}
        {imageUrl && (
          <div className="relative inline-block mb-2">
            <img src={imageUrl} alt="Preview" className="h-20 rounded-lg" />
            <button
              onClick={() => setImageUrl(null)}
              className="absolute -top-2 -right-2 bg-black/50 text-white rounded-full p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        
        <div className="flex items-center gap-1.5">
          {/* Attachment button */}
          <Button variant="ghost" size="icon" className="rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-200 shrink-0">
            <Paperclip className="h-5 w-5" />
          </Button>
          
          {/* Emoji button */}
          <Button variant="ghost" size="icon" className="rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-200 shrink-0">
            <Smile className="h-5 w-5" />
          </Button>
          
          {/* Input */}
          <Input
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 h-9 bg-background border-border rounded-full px-4 focus-visible:ring-primary"
            disabled={isSending}
          />
          
          {/* Send or Mic button */}
          {inputValue.trim() || imageUrl ? (
            <Button 
              size="icon" 
              onClick={handleSend}
              disabled={isSending}
              className="rounded-full h-9 w-9 bg-[#0085ff] hover:bg-[#0070e0] shrink-0"
            >
              <Send className="h-4 w-4 text-white" />
            </Button>
          ) : (
            <Button 
              size="icon" 
              className="rounded-full h-9 w-9 bg-[#0085ff] hover:bg-[#0070e0] shrink-0"
            >
              <Mic className="h-4 w-4 text-white" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Main MessagesPage Component
export function MessagesPage() {
  const { token, user: currentUser } = useAuthStore();
  const { messageCount, setMessageCount, decrementMessageCount } = useUnreadStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<User | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time connection
  const { 
    isConnected, 
    onNewMessage, 
    onTyping,
    sendMessage: sendRealtimeMessage,
    startTyping,
    stopTyping,
    markMessagesRead
  } = useRealtime();

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!token) return;
    setIsLoadingConversations(true);
    try {
      const response = await fetch('/api/messages', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
        
        // Calculate total unread
        const totalUnread = (data.conversations || []).reduce(
          (sum: number, conv: Conversation) => sum + conv.unreadCount, 0
        );
        setMessageCount(totalUnread);
      }
    } catch (error) {
      console.error('Fetch conversations error:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [token, setMessageCount]);

  // Fetch messages with a user
  const fetchMessages = useCallback(async (userId: string) => {
    if (!token) return;
    setIsLoadingMessages(true);
    try {
      const response = await fetch(`/api/messages?userId=${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        
        // Update unread count
        markMessagesRead(currentUser?.id || '', userId);
      }
    } catch (error) {
      console.error('Fetch messages error:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [token, currentUser?.id, markMessagesRead]);

  // Send message
  const sendMessage = async (content: string, imageUrl?: string) => {
    if (!token || !selectedPartner) return;
    setIsSending(true);
    
    // Start typing indicator (to stop any lingering)
    stopTyping(currentUser?.id || '', selectedPartner.id);
    
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiverId: selectedPartner.id,
          content,
          imageUrl
        })
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.message]);
        
        // Send real-time notification
        sendRealtimeMessage({
          messageId: data.message.id,
          senderId: currentUser?.id || '',
          receiverId: selectedPartner.id,
          content,
          imageUrl,
          createdAt: data.message.createdAt
        });
        
        // Update conversations list
        fetchConversations();
      }
    } catch (error) {
      console.error('Send message error:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Handle typing
  const handleTyping = useCallback(() => {
    if (!selectedPartner || !currentUser) return;
    
    startTyping(currentUser.id, selectedPartner.id);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(currentUser.id, selectedPartner.id);
    }, 3000);
  }, [selectedPartner, currentUser, startTyping, stopTyping]);

  // Listen for new messages via WebSocket
  useEffect(() => {
    onNewMessage((message) => {
      if (selectedPartner?.id === message.senderId) {
        // Add message to current chat
        setMessages(prev => [...prev, message as unknown as Message]);
        // Mark as read
        markMessagesRead(currentUser?.id || '', message.senderId);
      } else {
        // Update conversations list
        fetchConversations();
        // Increment unread count
        decrementMessageCount();
      }
    });
  }, [onNewMessage, selectedPartner, fetchConversations, markMessagesRead, currentUser?.id, decrementMessageCount]);

  // Listen for typing indicators
  useEffect(() => {
    onTyping((event) => {
      if (selectedPartner?.id === event.userId) {
        setIsTyping(event.isTyping);
      }
    });
  }, [onTyping, selectedPartner]);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Fetch messages when partner is selected
  useEffect(() => {
    if (selectedPartner) {
      fetchMessages(selectedPartner.id);
      // Clear unread count for this conversation
      const conv = conversations.find(c => c.partner.id === selectedPartner.id);
      if (conv && conv.unreadCount > 0) {
        decrementMessageCount(conv.unreadCount);
      }
    }
  }, [selectedPartner, fetchMessages, conversations, decrementMessageCount]);

  // Handle selecting a conversation
  const handleSelectConversation = (partner: User) => {
    setSelectedPartner(partner);
  };

  // Handle selecting a user from new conversation modal
  const handleSelectNewUser = (user: User) => {
    const existingConv = conversations.find(c => c.partner.id === user.id);
    if (existingConv) {
      setSelectedPartner(user);
    } else {
      setSelectedPartner(user);
      setMessages([]);
    }
  };

  // Handle going back to conversations list
  const handleBack = () => {
    setSelectedPartner(null);
    setMessages([]);
    setIsTyping(false);
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] md:h-screen flex flex-col md:flex-row max-w-4xl mx-auto">
      {/* Conversations List - Hidden on mobile when chat is open */}
      <div className={cn(
        'flex-1 flex flex-col border-r border-border',
        selectedPartner ? 'hidden md:flex md:w-80' : 'w-full'
      )}>
        <ConversationsList
          conversations={conversations}
          isLoading={isLoadingConversations}
          onSelectConversation={handleSelectConversation}
          onNewConversation={() => setShowNewConversation(true)}
        />
      </div>

      {/* Chat View - Full width on mobile */}
      <div className={cn(
        'flex-1 flex flex-col',
        !selectedPartner && 'hidden md:flex'
      )}>
        {selectedPartner ? (
          <ChatView
            partner={selectedPartner}
            messages={messages}
            isLoading={isLoadingMessages}
            onBack={handleBack}
            onSendMessage={sendMessage}
            isSending={isSending}
            isTyping={isTyping}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground bg-background">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      <NewConversationModal
        isOpen={showNewConversation}
        onClose={() => setShowNewConversation(false)}
        onSelectUser={handleSelectNewUser}
      />
    </div>
  );
}

export default MessagesPage;

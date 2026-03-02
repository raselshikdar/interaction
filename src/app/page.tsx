'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore, useAppStore, useNotificationStore } from '@/store';
import { 
  FeedTabs, 
  Post, 
  PostSkeleton, 
  PostComposer,
  ProfilePage,
  ExplorePage,
  NotificationsPage,
  MessagesPage,
  LoginPage,
  SignupPage,
  MobileSidebar,
  FeedsPage,
  FeedsSettingsPage,
  SettingsPage,
  AccountSettingsPage,
  PrivacySecuritySettingsPage,
  NotificationsSettingsPage,
  ContentMediaSettingsPage,
  AppearanceSettingsPage,
  AccessibilitySettingsPage,
  LanguageSettingsPage,
  HelpSettingsPage,
  AboutSettingsPage,
  ModerationSettingsPage,
  AddAccountSettingsPage
} from '@/components/bsky';
import { Header } from '@/components/bsky';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Post as PostType } from '@/types';
import { 
  Sparkles,
  Plus,
  Home,
  Search,
  MessageCircle,
  Bell,
  User,
  Image as ImageIcon,
  ArrowLeft
} from 'lucide-react';

// Navigation view type
type ViewType = 'home' | 'explore' | 'notifications' | 'messages' | 'profile' | 'settings' | 'saved' | 'feeds' | 'feeds-settings' | 'lists' | 'chat' | 'search' 
  | 'settings-account' | 'settings-privacy' | 'settings-notifications' | 'settings-content' | 'settings-appearance' | 'settings-accessibility' | 'settings-language' | 'settings-help' | 'settings-about' | 'settings-moderation' | 'settings-add-account';

export default function HomePage() {
  const { user, isAuthenticated, token } = useAuthStore();
  const { currentFeed, setComposerOpen, setQuotePost, setReplyTo } = useAppStore();
  const { unreadCount } = useNotificationStore();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSignup, setShowSignup] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [profileHandle, setProfileHandle] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTopic, setSearchTopic] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<PostType[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  // Handle hash-based navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash.startsWith('profile/')) {
        setProfileHandle(hash.split('/')[1]);
        setCurrentView('profile');
        setSearchTopic(null);
      } else if (hash.startsWith('search/')) {
        const topic = decodeURIComponent(hash.split('/')[1]);
        setSearchTopic(topic);
        setCurrentView('search');
      } else if (['home', 'explore', 'notifications', 'messages', 'profile', 'settings', 'saved', 'feeds', 'feeds-settings', 'lists', 'chat',
        'settings-account', 'settings-privacy', 'settings-notifications', 'settings-content', 'settings-appearance', 'settings-accessibility', 'settings-language', 'settings-help', 'settings-about', 'settings-moderation', 'settings-add-account'
      ].includes(hash)) {
        setCurrentView(hash as ViewType);
        setProfileHandle(null);
        setSearchTopic(null);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    try {
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/posts?feed=${currentFeed}`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [currentFeed, token]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPosts();
    }
  }, [isAuthenticated, currentFeed, fetchPosts]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  // Pull to refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (contentRef.current?.scrollTop === 0) {
      setTouchStart(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart > 0 && contentRef.current?.scrollTop === 0) {
      const distance = e.touches[0].clientY - touchStart;
      if (distance > 0) {
        setIsPulling(true);
        setPullDistance(Math.min(distance, 100));
      }
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 60) {
      handleRefresh();
    }
    setIsPulling(false);
    setPullDistance(0);
    setTouchStart(0);
  };

  // Handle interactions
  const handleLike = async (postId: string) => {
    if (!token) return;
    try {
      await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleRepost = async (postId: string) => {
    if (!token) return;
    try {
      await fetch(`/api/posts/${postId}/repost`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Repost error:', error);
    }
  };

  const handleBookmark = async (postId: string) => {
    if (!token) return;
    try {
      await fetch(`/api/posts/${postId}/bookmark`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Bookmark error:', error);
    }
  };

  // Handle topic click from trending bar
  const handleTopicClick = (topic: string) => {
    window.location.hash = `search/${encodeURIComponent(topic)}`;
  };

  // Fetch search results
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (currentView === 'search' && searchTopic) {
        setIsSearchLoading(true);
        try {
          const headers: HeadersInit = {};
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          const response = await fetch(`/api/posts?search=${encodeURIComponent(searchTopic)}`, { headers });
          if (response.ok) {
            const data = await response.json();
            setSearchResults(data.posts);
          }
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setIsSearchLoading(false);
        }
      }
    };
    fetchSearchResults();
  }, [currentView, searchTopic, token]);

  // Navigate to view
  const navigateTo = (view: string, handle?: string) => {
    if (handle) {
      window.location.hash = `profile/${handle}`;
    } else {
      window.location.hash = view;
    }
  };

  // Show auth pages if not logged in
  if (!isAuthenticated || !user) {
    if (showSignup) {
      return <SignupPage />;
    }
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-4 bg-background border-b border-border">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-[#0085ff]" fill="currentColor">
              <circle cx="12" cy="12" r="10" fill="currentColor"/>
              <circle cx="8" cy="10" r="1.5" fill="white"/>
              <circle cx="16" cy="10" r="1.5" fill="white"/>
              <path d="M8 14c0 0 1.5 3 4 3s4-3 4-3" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
            </svg>
            <span className="font-bold text-xl text-black">Bluesky</span>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              className="text-black hover:bg-gray-100 rounded-full text-[15px]"
              onClick={() => setShowSignup(false)}
            >
              Sign in
            </Button>
            <Button 
              className="bg-[#0085ff] hover:bg-[#0070e0] text-white rounded-full text-[15px] px-4"
              onClick={() => setShowSignup(true)}
            >
              Create account
            </Button>
          </div>
        </header>

        {/* Landing Page */}
        <main className="flex-1">
          <section className="py-20 px-4 text-center bg-background">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-bold text-black mb-6">
                Your home for{' '}
                <span className="text-[#0085ff]">social internet</span>
              </h1>
              <p className="text-xl text-gray-500 mb-8 max-w-2xl mx-auto">
                Join a thriving community where you can express yourself freely. 
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-[#0085ff] hover:bg-[#0070e0] text-white rounded-full px-8 h-12 text-[15px]" 
                  onClick={() => setShowSignup(true)}
                >
                  Get Started
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="rounded-full px-8 h-12 border-gray-300 text-black text-[15px]"
                  onClick={() => setShowSignup(false)}
                >
                  Sign in
                </Button>
              </div>
            </div>
          </section>
        </main>

        <LoginPage />
      </div>
    );
  }

  // Render current view content
  const renderContent = () => {
    switch (currentView) {
      case 'explore':
        return <ExplorePage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'messages':
      case 'chat':
        return <MessagesPage />;
      case 'profile':
        return <ProfilePage handle={profileHandle || user.handle} onBack={() => window.location.hash = 'home'} />;
      case 'settings':
        return <SettingsPage onBack={() => window.location.hash = 'home'} onNavigate={(view) => window.location.hash = view} />;
      case 'settings-account':
        return <AccountSettingsPage onBack={() => window.location.hash = 'settings'} />;
      case 'settings-privacy':
        return <PrivacySecuritySettingsPage onBack={() => window.location.hash = 'settings'} />;
      case 'settings-notifications':
        return <NotificationsSettingsPage onBack={() => window.location.hash = 'settings'} />;
      case 'settings-content':
        return <ContentMediaSettingsPage onBack={() => window.location.hash = 'settings'} />;
      case 'settings-appearance':
        return <AppearanceSettingsPage onBack={() => window.location.hash = 'settings'} />;
      case 'settings-accessibility':
        return <AccessibilitySettingsPage onBack={() => window.location.hash = 'settings'} />;
      case 'settings-language':
        return <LanguageSettingsPage onBack={() => window.location.hash = 'settings'} />;
      case 'settings-help':
        return <HelpSettingsPage onBack={() => window.location.hash = 'settings'} />;
      case 'settings-about':
        return <AboutSettingsPage onBack={() => window.location.hash = 'settings'} />;
      case 'settings-moderation':
        return <ModerationSettingsPage onBack={() => window.location.hash = 'settings'} />;
      case 'settings-add-account':
        return <AddAccountSettingsPage onBack={() => window.location.hash = 'settings'} />;
      case 'saved':
        return (
          <>
            <div className="sticky top-0 z-20 bg-background border-b border-border">
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => window.location.hash = 'home'}
                  className="p-2 -ml-2 rounded-full hover:bg-muted"
                >
                  <ArrowLeft className="h-5 w-5 text-foreground" />
                </button>
                <h1 className="text-[17px] font-semibold text-foreground">Saved Posts</h1>
              </div>
            </div>
            <div className="p-4">
              <Card className="border-gray-200">
                <CardContent className="p-4">
                  <p className="text-gray-500 text-[15px]">Your saved posts will appear here...</p>
                </CardContent>
              </Card>
            </div>
          </>
        );
      case 'feeds':
        return (
          <FeedsPage 
            onBack={() => window.location.hash = 'home'}
            onOpenSettings={() => window.location.hash = 'feeds-settings'}
            onFeedSelect={(feedId) => {
              // Map feed IDs to feed types
              const feedMap: Record<string, string> = {
                'discover': 'discover',
                'following': 'following',
                'hot': 'hot',
                'friends': 'discover',
                'team': 'discover',
                'news': 'discover',
                'science': 'discover',
              };
              useAppStore.getState().setCurrentFeed(feedMap[feedId] as any || 'discover');
              window.location.hash = 'home';
            }}
          />
        );
      case 'feeds-settings':
        return (
          <FeedsSettingsPage 
            onBack={() => window.location.hash = 'feeds'}
            onSave={() => window.location.hash = 'feeds'}
          />
        );
      case 'lists':
        return (
          <>
            <div className="sticky top-0 z-20 bg-background border-b border-border">
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => window.location.hash = 'home'}
                  className="p-2 -ml-2 rounded-full hover:bg-muted"
                >
                  <ArrowLeft className="h-5 w-5 text-foreground" />
                </button>
                <h1 className="text-[17px] font-semibold text-foreground">My Lists</h1>
              </div>
            </div>
            <div className="p-4">
              <Card className="border-gray-200">
                <CardContent className="p-4">
                  <p className="text-gray-500 text-[15px]">Your lists will appear here...</p>
                </CardContent>
              </Card>
            </div>
          </>
        );
      case 'search':
        return (
          <>
            {/* Search Header */}
            <div className="sticky top-0 z-20 bg-background border-b border-border px-4 py-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.location.hash = 'home'}
                  className="p-2 -ml-2 rounded-full hover:bg-muted"
                >
                  <ArrowLeft className="h-5 w-5 text-foreground" />
                </button>
                <h1 className="text-[17px] font-semibold text-foreground">#{searchTopic}</h1>
              </div>
            </div>

            {/* Search Results */}
            {isSearchLoading ? (
              <>
                <PostSkeleton />
                <PostSkeleton />
                <PostSkeleton />
              </>
            ) : searchResults.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="font-semibold text-black mb-2">No posts found</h3>
                <p className="text-gray-500 text-[14px]">
                  No posts found for #{searchTopic}
                </p>
              </div>
            ) : (
              searchResults.map((post) => (
                <Post
                  key={post.id}
                  post={post}
                  onLike={() => handleLike(post.id)}
                  onRepost={() => handleRepost(post.id)}
                  onBookmark={() => handleBookmark(post.id)}
                  onReply={() => {
                    setReplyTo(post);
                    setComposerOpen(true);
                  }}
                  onQuote={() => {
                    setQuotePost(post);
                    setComposerOpen(true);
                  }}
                />
              ))
            )}
          </>
        );
      default:
        // Home feed view
        return (
          <>  
            {/* Pull to Refresh Indicator */}
            {isPulling && (
              <div 
                className="flex items-center justify-center py-2 bg-gray-50 transition-all"
                style={{ height: Math.min(pullDistance, 60) }}
              >
                <div className={cn(
                  "text-gray-400 transition-transform",
                  pullDistance > 60 && "rotate-180"
                )}>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M19 12l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            )}

            {/* Refreshing Indicator */}
            {refreshing && (
              <div className="flex items-center justify-center py-3 bg-gray-50">
                <div className="h-5 w-5 border-2 border-gray-300 border-t-[#0085ff] rounded-full animate-spin" />
              </div>
            )}

            {/* Post Composer - EXACT bsky one-line style */}
            <div className="border-b border-border px-4 py-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 rounded-full shrink-0">
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback>{(user.displayName || user.handle)[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <button 
                  className="flex-1 text-left text-muted-foreground text-[15px] hover:text-foreground transition-colors"
                  onClick={() => setComposerOpen(true)}
                >
                  What's up?
                </button>
                <button 
                  className="p-2 rounded-full hover:bg-muted transition-colors text-[#0085ff]"
                  onClick={() => setComposerOpen(true)}
                >
                  <ImageIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Posts Feed */}
            {isLoading ? (
              <>
                <PostSkeleton />
                <PostSkeleton />
                <PostSkeleton />
                <PostSkeleton />
                <PostSkeleton />
              </>
            ) : posts.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="font-semibold text-black mb-2">No posts yet</h3>
                <p className="text-gray-500 text-[14px]">
                  {currentFeed === 'following' 
                    ? "Follow some people to see their posts here!"
                    : "Be the first to post!"}
                </p>
                <Button 
                  className="mt-4 rounded-full bg-[#0085ff] hover:bg-[#0070e0] text-[15px]" 
                  onClick={() => setComposerOpen(true)}
                >
                  Create post
                </Button>
              </div>
            ) : (
              posts.map((post) => (
                <Post
                  key={post.id}
                  post={post}
                  onLike={() => handleLike(post.id)}
                  onRepost={() => handleRepost(post.id)}
                  onBookmark={() => handleBookmark(post.id)}
                  onReply={() => {
                    setReplyTo(post);
                    setComposerOpen(true);
                  }}
                  onQuote={() => {
                    setQuotePost(post);
                    setComposerOpen(true);
                  }}
                />
              ))
            )}
          </>
        );
    }
  };

  // Main authenticated view - EXACT bsky layout
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Mobile Sidebar */}
      <MobileSidebar 
        open={sidebarOpen} 
        onOpenChange={setSidebarOpen}
        onNavigate={navigateTo}
      />

      {/* Header - Only show on home page */}
      {currentView === 'home' && <Header onMenuClick={() => setSidebarOpen(true)} />}

      {/* Main Content Area - Natural page scroll for sticky to work */}
      <div className="flex flex-1">
        {/* Main Feed Column - EXACT bsky max-width */}
        <main 
          ref={contentRef}
          className="flex-1 min-w-0 max-w-[600px] mx-auto border-x border-gray-200 pb-16 md:pb-0"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Feed Tabs - Sticky with Header for home view */}
          {currentView === 'home' && <FeedTabs onTopicClick={handleTopicClick} />}
          
          {renderContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation - EXACT bsky style */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
        <div className="flex items-center justify-around h-14">
          {[
            { id: 'home', icon: Home },
            { id: 'explore', icon: Search },
            { id: 'messages', icon: MessageCircle },
            { id: 'notifications', icon: Bell },
            { id: 'profile', icon: User },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id, item.id === 'profile' ? user.handle : undefined)}
              className={cn(
                'flex flex-col items-center justify-center w-14 h-14 relative',
                currentView === item.id ? 'text-black' : 'text-gray-500'
              )}
            >
              <div className="relative">
                <item.icon className="h-6 w-6" />
                {item.id === 'notifications' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </nav>

      {/* Floating Post Button - Mobile */}
      <Button
        onClick={() => setComposerOpen(true)}
        className="fixed bottom-20 right-4 rounded-full h-14 w-14 shadow-lg z-40 md:hidden bg-[#0085ff] hover:bg-[#0070e0]"
        size="icon"
      >
        <Plus className="h-6 w-6 text-white" />
      </Button>

      {/* Post Composer */}
      <PostComposer />
    </div>
  );
}

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, useAppStore, useNotificationStore } from '@/store';
import { 
  FeedTabs, 
  Post, 
  PostSkeleton, 
  PostComposer,
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
  AddAccountSettingsPage,
  PostDetailPage
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

export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<PostType[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  // Derive view state from URL path
  const getViewFromPath = () => {
    if (pathname === '/' || pathname === '/home') return 'home';
    if (pathname.startsWith('/post/')) return 'post';
    if (pathname.startsWith('/search/')) return 'search';
    const seg = pathname.slice(1);
    return seg || 'home';
  };

  const currentView = getViewFromPath();
  const activePostId = pathname.startsWith('/post/') ? pathname.split('/')[2] : null;
  const searchTopic = pathname.startsWith('/search/') ? decodeURIComponent(pathname.split('/')[2] || '') : null;

  // Navigation helpers
  const nav = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  const handlePostClick = (postId: string) => nav(`/post/${postId}`);
  const handleAuthorClick = (handle: string) => nav(`/profile/${handle}`);
  const handleTopicClick = (topic: string) => nav(`/search/${encodeURIComponent(topic)}`);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    try {
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
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
    if (isAuthenticated) fetchPosts();
  }, [isAuthenticated, currentFeed, fetchPosts]);

  // Fetch search results when on /search/:topic
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (currentView === 'search' && searchTopic) {
        setIsSearchLoading(true);
        try {
          const headers: HeadersInit = {};
          if (token) headers['Authorization'] = `Bearer ${token}`;
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

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (contentRef.current?.scrollTop === 0) setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart > 0 && contentRef.current?.scrollTop === 0) {
      const distance = e.touches[0].clientY - touchStart;
      if (distance > 0) { setIsPulling(true); setPullDistance(Math.min(distance, 100)); }
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 60) handleRefresh();
    setIsPulling(false); setPullDistance(0); setTouchStart(0);
  };

  const handleLike = async (postId: string) => {
    if (!token) return;
    try {
      await fetch(`/api/posts/${postId}/like`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
    } catch (error) { console.error('Like error:', error); }
  };

  const handleRepost = async (postId: string) => {
    if (!token) return;
    try {
      await fetch(`/api/posts/${postId}/repost`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
    } catch (error) { console.error('Repost error:', error); }
  };

  const handleBookmark = async (postId: string) => {
    if (!token) return;
    try {
      await fetch(`/api/posts/${postId}/bookmark`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
    } catch (error) { console.error('Bookmark error:', error); }
  };

  // Unauthenticated landing
  if (!isAuthenticated || !user) {
    if (showSignup) return <SignupPage />;
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-4 bg-background border-b border-border">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-[#0085ff]" fill="currentColor">
              <circle cx="12" cy="12" r="10" fill="currentColor"/>
              <circle cx="8" cy="10" r="1.5" fill="white"/>
              <circle cx="16" cy="10" r="1.5" fill="white"/>
              <path d="M8 14c0 0 1.5 3 4 3s4-3 4-3" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
            </svg>
            <span className="font-bold text-xl text-foreground">Bluesky</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" className="text-foreground hover:bg-muted rounded-full text-[15px]" onClick={() => setShowSignup(false)}>Sign in</Button>
            <Button className="bg-[#0085ff] hover:bg-[#0070e0] text-white rounded-full text-[15px] px-4" onClick={() => setShowSignup(true)}>Create account</Button>
          </div>
        </header>
        <main className="flex-1">
          <section className="py-20 px-4 text-center bg-background">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
                Your home for <span className="text-[#0085ff]">social internet</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join a thriving community where you can express yourself freely.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-[#0085ff] hover:bg-[#0070e0] text-white rounded-full px-8 h-12 text-[15px]" onClick={() => setShowSignup(true)}>Get Started</Button>
                <Button size="lg" variant="outline" className="rounded-full px-8 h-12 text-[15px]" onClick={() => setShowSignup(false)}>Sign in</Button>
              </div>
            </div>
          </section>
        </main>
        <LoginPage />
      </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'explore':
        return <ExplorePage onBack={() => nav('/')} />;
      case 'notifications':
        return <NotificationsPage onBack={() => nav('/')} onNavigate={nav} />;
      case 'messages':
        return <MessagesPage onBack={() => nav('/')} onNavigate={nav} />;
      case 'settings':
        return <SettingsPage onBack={() => nav('/')} onNavigate={(view) => nav(`/${view}`)} />;
      case 'settings-account':
        return <AccountSettingsPage onBack={() => nav('/settings')} />;
      case 'settings-privacy':
        return <PrivacySecuritySettingsPage onBack={() => nav('/settings')} />;
      case 'settings-notifications':
        return <NotificationsSettingsPage onBack={() => nav('/settings')} />;
      case 'settings-content':
        return <ContentMediaSettingsPage onBack={() => nav('/settings')} />;
      case 'settings-appearance':
        return <AppearanceSettingsPage onBack={() => nav('/settings')} />;
      case 'settings-accessibility':
        return <AccessibilitySettingsPage onBack={() => nav('/settings')} />;
      case 'settings-language':
        return <LanguageSettingsPage onBack={() => nav('/settings')} />;
      case 'settings-help':
        return <HelpSettingsPage onBack={() => nav('/settings')} />;
      case 'settings-about':
        return <AboutSettingsPage onBack={() => nav('/settings')} />;
      case 'settings-moderation':
        return <ModerationSettingsPage onBack={() => nav('/settings')} />;
      case 'settings-add-account':
        return <AddAccountSettingsPage onBack={() => nav('/settings')} />;
      case 'post':
        return (
          <PostDetailPage
            postId={activePostId!}
            onBack={() => router.back()}
            onPostClick={handlePostClick}
            onAuthorClick={handleAuthorClick}
            token={token}
            onLike={handleLike}
            onRepost={handleRepost}
            onBookmark={handleBookmark}
            onReply={(post) => { setReplyTo(post); setComposerOpen(true); }}
            onQuote={(post) => { setQuotePost(post); setComposerOpen(true); }}
          />
        );
      case 'saved':
        return (
          <>
            <div className="sticky top-0 z-20 bg-background border-b border-border">
              <div className="flex items-center gap-3 px-4 py-3">
                <button onClick={() => nav('/')} className="p-2 -ml-2 rounded-full hover:bg-muted">
                  <ArrowLeft className="h-5 w-5 text-foreground" />
                </button>
                <h1 className="text-[17px] font-semibold text-foreground">Saved Posts</h1>
              </div>
            </div>
            <div className="p-4">
              <Card><CardContent className="p-4"><p className="text-muted-foreground text-[15px]">Your saved posts will appear here...</p></CardContent></Card>
            </div>
          </>
        );
      case 'feeds':
        return (
          <FeedsPage
            onBack={() => nav('/')}
            onOpenSettings={() => nav('/feeds-settings')}
            onFeedSelect={(feedId) => {
              const feedMap: Record<string, string> = { discover: 'discover', following: 'following', hot: 'hot', friends: 'discover', team: 'discover', news: 'discover', science: 'discover' };
              useAppStore.getState().setCurrentFeed(feedMap[feedId] as any || 'discover');
              nav('/');
            }}
          />
        );
      case 'feeds-settings':
        return <FeedsSettingsPage onBack={() => nav('/feeds')} onSave={() => nav('/feeds')} />;
      case 'lists':
        return (
          <>
            <div className="sticky top-0 z-20 bg-background border-b border-border">
              <div className="flex items-center gap-3 px-4 py-3">
                <button onClick={() => nav('/')} className="p-2 -ml-2 rounded-full hover:bg-muted">
                  <ArrowLeft className="h-5 w-5 text-foreground" />
                </button>
                <h1 className="text-[17px] font-semibold text-foreground">My Lists</h1>
              </div>
            </div>
            <div className="p-4">
              <Card><CardContent className="p-4"><p className="text-muted-foreground text-[15px]">Your lists will appear here...</p></CardContent></Card>
            </div>
          </>
        );
      case 'search':
        return (
          <>
            <div className="sticky top-0 z-20 bg-background border-b border-border px-4 py-3">
              <div className="flex items-center gap-3">
                <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-muted">
                  <ArrowLeft className="h-5 w-5 text-foreground" />
                </button>
                <h1 className="text-[17px] font-semibold text-foreground">#{searchTopic}</h1>
              </div>
            </div>
            {isSearchLoading ? (
              <><PostSkeleton /><PostSkeleton /><PostSkeleton /></>
            ) : searchResults.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">No posts found</h3>
                <p className="text-muted-foreground text-[14px]">No posts found for #{searchTopic}</p>
              </div>
            ) : (
              searchResults.map((post) => (
                <Post key={post.id} post={post} onPostClick={handlePostClick} onAuthorClick={handleAuthorClick}
                  onLike={() => handleLike(post.id)} onRepost={() => handleRepost(post.id)} onBookmark={() => handleBookmark(post.id)}
                  onReply={() => { setReplyTo(post); setComposerOpen(true); }}
                  onQuote={() => { setQuotePost(post); setComposerOpen(true); }}
                />
              ))
            )}
          </>
        );
      default:
        // Home feed
        return (
          <>
            {isPulling && (
              <div className="flex items-center justify-center py-2 bg-muted transition-all" style={{ height: Math.min(pullDistance, 60) }}>
                <div className={cn('text-muted-foreground transition-transform', pullDistance > 60 && 'rotate-180')}>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
                </div>
              </div>
            )}
            {refreshing && (
              <div className="flex items-center justify-center py-3 bg-muted">
                <div className="h-5 w-5 border-2 border-border border-t-[#0085ff] rounded-full animate-spin" />
              </div>
            )}
            <div className="border-b border-border px-4 py-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 rounded-full shrink-0">
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback>{(user.displayName || user.handle)[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <button className="flex-1 text-left text-muted-foreground text-[15px] hover:text-foreground transition-colors" onClick={() => setComposerOpen(true)}>
                  What's up?
                </button>
                <button className="p-2 rounded-full hover:bg-muted transition-colors text-[#0085ff]" onClick={() => setComposerOpen(true)}>
                  <ImageIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            {isLoading ? (
              <><PostSkeleton /><PostSkeleton /><PostSkeleton /><PostSkeleton /><PostSkeleton /></>
            ) : posts.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">No posts yet</h3>
                <p className="text-muted-foreground text-[14px]">
                  {currentFeed === 'following' ? 'Follow some people to see their posts here!' : 'Be the first to post!'}
                </p>
                <Button className="mt-4 rounded-full bg-[#0085ff] hover:bg-[#0070e0] text-[15px]" onClick={() => setComposerOpen(true)}>Create post</Button>
              </div>
            ) : (
              posts.map((post) => (
                <Post key={post.id} post={post} onPostClick={handlePostClick} onAuthorClick={handleAuthorClick}
                  onLike={() => handleLike(post.id)} onRepost={() => handleRepost(post.id)} onBookmark={() => handleBookmark(post.id)}
                  onReply={() => { setReplyTo(post); setComposerOpen(true); }}
                  onQuote={() => { setQuotePost(post); setComposerOpen(true); }}
                />
              ))
            )}
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MobileSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} onNavigate={nav} />

      {currentView === 'home' && <Header onMenuClick={() => setSidebarOpen(true)} />}

      <div className="flex flex-1">
        <main
          ref={contentRef}
          className="flex-1 min-w-0 max-w-[600px] mx-auto border-x border-border pb-16 md:pb-0"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {currentView === 'home' && <FeedTabs onTopicClick={handleTopicClick} />}
          {renderContent()}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border md:hidden z-50">
        <div className="flex items-center justify-around h-14">
          {[
            { id: 'home', path: '/', icon: Home },
            { id: 'explore', path: '/explore', icon: Search },
            { id: 'messages', path: '/messages', icon: MessageCircle },
            { id: 'notifications', path: '/notifications', icon: Bell },
            { id: 'profile', path: `/profile/${user.handle}`, icon: User },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => nav(item.path)}
              className={cn(
                'flex flex-col items-center justify-center w-14 h-14 relative',
                currentView === item.id ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              <div className="relative">
                <item.icon className="h-6 w-6" />
                {item.id === 'notifications' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-foreground text-background text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </nav>

      <Button
        onClick={() => setComposerOpen(true)}
        className="fixed bottom-20 right-4 rounded-full h-14 w-14 shadow-lg z-40 md:hidden bg-[#0085ff] hover:bg-[#0070e0]"
        size="icon"
      >
        <Plus className="h-6 w-6 text-white" />
      </Button>

      <PostComposer />
    </div>
  );
}

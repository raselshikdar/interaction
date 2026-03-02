'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  Search, 
  Flame, 
  Users, 
  Heart, 
  Newspaper, 
  FlaskConical,
  Pin,
  ChevronRight,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

// Default feeds
const defaultFeeds = [
  { id: 'discover', name: 'Discover', icon: Flame, color: '#0085ff' },
  { id: 'following', name: 'Following', icon: Users, color: '#0085ff' },
  { id: 'hot', name: "What's Hot Classic", icon: Flame, color: '#0085ff' },
  { id: 'friends', name: 'Popular With Friends', icon: Heart, color: '#0085ff' },
  { id: 'team', name: 'Bluesky Team', icon: Sparkles, color: '#0085ff' },
  { id: 'news', name: 'News', icon: Newspaper, color: '#6b7280' },
  { id: 'science', name: 'Science', icon: FlaskConical, color: '#0085ff' },
];

// Discover feeds (community feeds)
const discoverFeeds = [
  { 
    id: 'mutuals', 
    name: 'Mutuals', 
    creator: '@skyfeed.xyz',
    description: 'Posts from users who are following you back',
    likes: 28508,
    color: '#22c55e'
  },
  { 
    id: 'artists', 
    name: 'Artists: Trending', 
    creator: '@bsky.art',
    description: 'Trending artwork from the community',
    likes: 32632,
    color: '#000000'
  },
  { 
    id: 'blacksky', 
    name: 'Blacksky', 
    creator: '@rude1.blacksky.social',
    description: 'A feed for the Blacksky community',
    likes: 28046,
    color: '#a855f7'
  },
];

interface FeedsPageProps {
  onOpenSettings?: () => void;
  onFeedSelect?: (feedId: string) => void;
  onBack?: () => void;
}

export function FeedsPage({ onOpenSettings, onFeedSelect, onBack }: FeedsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [pinnedFeeds, setPinnedFeeds] = useState<string[]>([]);

  const handlePinFeed = (feedId: string) => {
    if (pinnedFeeds.includes(feedId)) {
      setPinnedFeeds(pinnedFeeds.filter(id => id !== feedId));
    } else {
      setPinnedFeeds([...pinnedFeeds, feedId]);
    }
  };

  const formatLikes = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5 text-black" />
            </button>
            <h1 className="text-[17px] font-semibold text-black">Feeds</h1>
          </div>
          <button 
            onClick={onOpenSettings}
            className="p-2 -mr-2 rounded-full hover:bg-gray-100"
          >
            <Settings className="h-5 w-5 text-black" />
          </button>
        </div>
      </div>

      {/* My Feeds Section */}
      <div className="border-b border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="h-10 w-10 rounded-full bg-[#0085ff] flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
              <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z"/>
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-[15px] font-semibold text-black">My Feeds</h2>
            <p className="text-[13px] text-gray-500">All the feeds you've saved, right in one place.</p>
          </div>
        </div>

        {/* Feed List */}
        <div className="pb-2">
          {defaultFeeds.map((feed) => (
            <button
              key={feed.id}
              onClick={() => onFeedSelect?.(feed.id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: feed.color }}>
                <feed.icon className="h-5 w-5 text-white" />
              </div>
              <span className="flex-1 text-left text-[15px] font-medium text-black">{feed.name}</span>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Discover New Feeds Section */}
      <div className="border-b border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="h-10 w-10 rounded-full bg-[#0085ff] flex items-center justify-center">
            <Search className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-[15px] font-semibold text-black">Discover New Feeds</h2>
            <p className="text-[13px] text-gray-500">Choose your own timeline! Feeds built by the community help you find content you love.</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search feeds"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-[15px] text-black placeholder-gray-400 outline-none"
            />
          </div>
        </div>

        {/* Discover Feed List */}
        <div className="pb-2">
          {discoverFeeds.map((feed) => (
            <div
              key={feed.id}
              className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div 
                className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-[14px] shrink-0"
                style={{ backgroundColor: feed.color }}
              >
                {feed.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[15px] font-medium text-black">{feed.name}</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePinFeed(feed.id)}
                    className={cn(
                      "h-8 px-3 text-[13px] rounded-full border",
                      pinnedFeeds.includes(feed.id)
                        ? "bg-[#0085ff] border-[#0085ff] text-white"
                        : "border-gray-300 text-black hover:bg-gray-50"
                    )}
                  >
                    <Pin className="h-3 w-3 mr-1" />
                    {pinnedFeeds.includes(feed.id) ? 'Pinned' : 'Pin Feed'}
                  </Button>
                </div>
                <p className="text-[13px] text-gray-500">Feed by {feed.creator}</p>
                <p className="text-[13px] text-gray-600 mt-1">{feed.description}</p>
                <p className="text-[12px] text-gray-400 mt-1">Liked by {formatLikes(feed.likes)} users</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Feeds Settings Page
interface FeedsSettingsPageProps {
  onBack?: () => void;
  onSave?: () => void;
}

export function FeedsSettingsPage({ onBack, onSave }: FeedsSettingsPageProps) {
  const [pinnedFeeds, setPinnedFeeds] = useState([
    { id: 'discover', name: 'Discover', creator: '@bsky.app' },
    { id: 'following', name: 'Following', creator: '' },
    { id: 'hot', name: "What's Hot Classic", creator: '@bsky.app' },
  ]);

  const [savedFeeds, setSavedFeeds] = useState([
    { id: 'friends', name: 'Popular With Friends', creator: '@bsky.app' },
    { id: 'team', name: 'Bluesky Team', creator: '@bsky.app' },
    { id: 'news', name: 'News', creator: '@aendra.com' },
    { id: 'science', name: 'Science', creator: '@bossett.social' },
  ]);

  const moveFeedUp = (index: number) => {
    if (index === 0) return;
    const newFeeds = [...pinnedFeeds];
    [newFeeds[index - 1], newFeeds[index]] = [newFeeds[index], newFeeds[index - 1]];
    setPinnedFeeds(newFeeds);
  };

  const moveFeedDown = (index: number) => {
    if (index === pinnedFeeds.length - 1) return;
    const newFeeds = [...pinnedFeeds];
    [newFeeds[index], newFeeds[index + 1]] = [newFeeds[index + 1], newFeeds[index]];
    setPinnedFeeds(newFeeds);
  };

  const pinFeed = (feed: { id: string; name: string; creator: string }) => {
    setSavedFeeds(savedFeeds.filter(f => f.id !== feed.id));
    setPinnedFeeds([...pinnedFeeds, feed]);
  };

  const unpinFeed = (feed: { id: string; name: string; creator: string }) => {
    setPinnedFeeds(pinnedFeeds.filter(f => f.id !== feed.id));
    setSavedFeeds([feed, ...savedFeeds]);
  };

  const deleteFeed = (feedId: string) => {
    setSavedFeeds(savedFeeds.filter(f => f.id !== feedId));
  };

  const getFeedIcon = (feedId: string) => {
    switch (feedId) {
      case 'discover': return Flame;
      case 'following': return Users;
      case 'hot': return Flame;
      case 'friends': return Heart;
      case 'team': return Sparkles;
      case 'news': return Newspaper;
      case 'science': return FlaskConical;
      default: return Sparkles;
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-black" />
          </button>
          <h1 className="text-[17px] font-semibold text-black">Feeds</h1>
          <Button 
            variant="ghost" 
            className="text-[15px] text-gray-400 hover:text-black"
            onClick={onSave}
          >
            Save
          </Button>
        </div>
      </div>

      {/* Pinned Feeds */}
      <div className="border-b border-gray-200">
        <div className="px-4 py-3">
          <h2 className="text-[15px] font-semibold text-black">Pinned Feeds</h2>
        </div>
        {pinnedFeeds.map((feed, index) => {
          const Icon = getFeedIcon(feed.id);
          return (
            <div
              key={feed.id}
              className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0"
            >
              <div className="h-10 w-10 rounded-lg bg-[#0085ff] flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-medium text-black">{feed.name}</h3>
                {feed.creator && (
                  <p className="text-[13px] text-gray-500">Feed by {feed.creator}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => moveFeedUp(index)}
                  disabled={index === 0}
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 15l-6-6-6 6" />
                  </svg>
                </button>
                <button
                  onClick={() => moveFeedDown(index)}
                  disabled={index === pinnedFeeds.length - 1}
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                <button
                  onClick={() => unpinFeed(feed)}
                  className="p-1.5 rounded hover:bg-gray-100"
                >
                  <Pin className="h-4 w-4 text-[#0085ff]" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Saved Feeds */}
      <div className="border-b border-gray-200">
        <div className="px-4 py-3">
          <h2 className="text-[15px] font-semibold text-black">Saved Feeds</h2>
        </div>
        {savedFeeds.map((feed) => {
          const Icon = getFeedIcon(feed.id);
          return (
            <div
              key={feed.id}
              className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0"
            >
              <div className="h-10 w-10 rounded-lg bg-[#0085ff] flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-medium text-black">{feed.name}</h3>
                {feed.creator && (
                  <p className="text-[13px] text-gray-500">Feed by {feed.creator}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => deleteFeed(feed.id)}
                  className="p-1.5 rounded hover:bg-gray-100"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
                  </svg>
                </button>
                <button
                  onClick={() => pinFeed(feed)}
                  className="p-1.5 rounded hover:bg-gray-100"
                >
                  <Pin className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Text */}
      <div className="px-4 py-4">
        <p className="text-[13px] text-gray-500">
          Feeds are custom algorithms that users build with a little coding expertise.{' '}
          <span className="text-[#0085ff]">See this guide</span> for more information.
        </p>
      </div>
    </div>
  );
}

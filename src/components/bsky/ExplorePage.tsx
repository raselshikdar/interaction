'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar, FollowButton } from './UserAvatar';
import { Search, TrendingUp, Pin, Check, X, Hash, ArrowLeft } from 'lucide-react';
import type { User } from '@/types';

// Static data for interests
const INTERESTS = [
  'Comics', 'Culture', 'Education', 'Entertainment', 'Food', 'Gaming',
  'Humor', 'Journalism', 'Movies', 'Music', 'News', 'Photography',
  'Science', 'Sports', 'Tech', 'TV'
] as const;

// Static data for feeds
interface FeedData {
  id: string;
  name: string;
  description: string;
  avatar: string | null;
  creator: string;
  pinsCount: number;
  isPinned?: boolean;
}

const FEEDS: FeedData[] = [
  {
    id: '1',
    name: 'Discover',
    description: 'Discover new content from across the network',
    avatar: null,
    creator: 'Bluesky Team',
    pinsCount: 2500000,
  },
  {
    id: '2',
    name: 'What\'s Hot',
    description: 'Trending posts from the past 24 hours',
    avatar: null,
    creator: 'Bluesky Team',
    pinsCount: 1800000,
  },
  {
    id: '3',
    name: 'Tech & Science',
    description: 'Latest in technology and scientific discoveries',
    avatar: null,
    creator: '@techfeed.bsky.social',
    pinsCount: 450000,
  },
  {
    id: '4',
    name: 'Art & Design',
    description: 'Creative works and design inspiration',
    avatar: null,
    creator: '@artfeed.bsky.social',
    pinsCount: 320000,
  },
  {
    id: '5',
    name: 'Gaming',
    description: 'Video games, esports, and gaming culture',
    avatar: null,
    creator: '@gaming.bsky.social',
    pinsCount: 280000,
  },
];

// Static data for trending topics
interface TrendingTopic {
  id: string;
  topic: string;
  description: string;
  postCount: number;
}

const TRENDING_TOPICS: TrendingTopic[] = [
  {
    id: '1',
    topic: '#Bluesky',
    description: 'The platform itself',
    postCount: 45000,
  },
  {
    id: '2',
    topic: '#TechNews',
    description: 'Latest technology updates',
    postCount: 32400,
  },
  {
    id: '3',
    topic: '#AI',
    description: 'Artificial Intelligence discussions',
    postCount: 28500,
  },
  {
    id: '4',
    topic: '#OpenWeb',
    description: 'Decentralized web and open protocols',
    postCount: 21000,
  },
  {
    id: '5',
    topic: '#Photography',
    description: 'Beautiful shots from photographers',
    postCount: 18500,
  },
];

// Static data for suggested users
const SUGGESTED_USERS: User[] = [
  {
    id: '1',
    email: 'alice@example.com',
    handle: 'alice.bsky.social',
    displayName: 'Alice Chen',
    avatar: null,
    banner: null,
    bio: 'Software engineer and open source enthusiast',
    website: null,
    verified: true,
    followersCount: 12500,
    followingCount: 340,
    postsCount: 892,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'bob@example.com',
    handle: 'bobtech.bsky.social',
    displayName: 'Bob Tech',
    avatar: null,
    banner: null,
    bio: 'Writing about tech, startups, and the future',
    website: 'https://bobtech.blog',
    verified: false,
    followersCount: 8200,
    followingCount: 512,
    postsCount: 1240,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    email: 'carol@example.com',
    handle: 'carol.art',
    displayName: 'Carol Artist',
    avatar: null,
    banner: null,
    bio: 'Digital artist | Creator of dreams',
    website: null,
    verified: true,
    followersCount: 25000,
    followingCount: 120,
    postsCount: 450,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    email: 'dan@example.com',
    handle: 'danwrites.bsky.social',
    displayName: 'Dan Writer',
    avatar: null,
    banner: null,
    bio: 'Author | Newsletter writer | Coffee addict',
    website: 'https://danwrites.substack.com',
    verified: false,
    followersCount: 15800,
    followingCount: 890,
    postsCount: 2100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Format number for display
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Interest Tag Component
interface InterestTagProps {
  interest: string;
  selected: boolean;
  onToggle: () => void;
}

function InterestTag({ interest, selected, onToggle }: InterestTagProps) {
  return (
    <button
      onClick={onToggle}
      className={`
        px-4 py-2 rounded-full text-sm font-medium transition-all
        border-2 hover:border-[#0085ff] hover:bg-[#0085ff]/5
        ${selected 
          ? 'bg-[#0085ff] text-white border-[#0085ff] hover:bg-[#0070e0]' 
          : 'bg-white text-gray-700 border-gray-200'
        }
      `}
    >
      {interest}
    </button>
  );
}

// Feed Card Component
interface FeedCardProps {
  feed: FeedData;
  onPinToggle: (feedId: string) => void;
}

function FeedCard({ feed, onPinToggle }: FeedCardProps) {
  const [isPinned, setIsPinned] = useState(feed.isPinned || false);

  const handlePin = () => {
    setIsPinned(!isPinned);
    onPinToggle(feed.id);
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Feed Avatar */}
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#0085ff] to-[#00a3ff] flex items-center justify-center text-white font-bold text-lg">
            {feed.name[0]}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{feed.name}</h3>
            </div>
            <p className="text-sm text-muted-foreground truncate">by {feed.creator}</p>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{feed.description}</p>
            
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-muted-foreground">
                {formatNumber(feed.pinsCount + (isPinned ? 1 : 0))} pinned
              </span>
              <Button
                variant={isPinned ? 'default' : 'outline'}
                size="sm"
                onClick={handlePin}
                className={`h-8 rounded-full ${isPinned ? 'bg-[#0085ff] hover:bg-[#0070e0]' : ''}`}
              >
                {isPinned ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Pinned
                  </>
                ) : (
                  <>
                    <Pin className="w-4 h-4 mr-1" />
                    Pin Feed
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Trending Topic Component
interface TrendingTopicCardProps {
  topic: TrendingTopic;
  rank: number;
}

function TrendingTopicCard({ topic, rank }: TrendingTopicCardProps) {
  return (
    <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
      <span className="text-lg font-bold text-gray-400 w-6">{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <Hash className="w-4 h-4 text-[#0085ff]" />
          <span className="font-semibold text-[#0085ff]">{topic.topic.replace('#', '')}</span>
        </div>
        <p className="text-sm text-gray-600 mt-0.5">{topic.description}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatNumber(topic.postCount)} posts
        </p>
      </div>
    </div>
  );
}

// Suggested User Card Component
interface SuggestedUserCardProps {
  user: User;
}

function SuggestedUserCard({ user }: SuggestedUserCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <UserAvatar 
        user={user} 
        size="md" 
        linkToProfile={false}
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{user.displayName}</p>
        <p className="text-sm text-muted-foreground truncate">@{user.handle}</p>
      </div>
      <FollowButton targetUser={user} size="sm" />
    </div>
  );
}

// Loading Skeleton Component
function ExploreSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search skeleton */}
      <Skeleton className="h-10 w-full rounded-full" />
      
      {/* Interests skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-20 rounded-full" />
          ))}
        </div>
      </div>
      
      {/* Feeds skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Main Explore Page Component
export function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set(['Tech', 'News']));
  const [isLoading] = useState(false);

  const toggleInterest = (interest: string) => {
    const newSelected = new Set(selectedInterests);
    if (newSelected.has(interest)) {
      newSelected.delete(interest);
    } else {
      newSelected.add(interest);
    }
    setSelectedInterests(newSelected);
  };

  const handlePinToggle = (feedId: string) => {
    console.log('Pin toggled for feed:', feedId);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <ExploreSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => window.history.back()}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-black" />
          </button>
          <h1 className="text-[17px] font-semibold text-black">Explore</h1>
        </div>
        
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search users and posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-11 rounded-full bg-gray-100 border-none focus-visible:ring-[#0085ff]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-5 h-5 text-muted-foreground hover:text-gray-700" />
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="p-4 space-y-8">
        {/* Your Interests Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-2xl">✨</span>
              Your Interests
            </h2>
            {selectedInterests.size > 0 && (
              <Badge variant="secondary" className="rounded-full">
                {selectedInterests.size} selected
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((interest) => (
              <InterestTag
                key={interest}
                interest={interest}
                selected={selectedInterests.has(interest)}
                onToggle={() => toggleInterest(interest)}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Select topics you&apos;re interested in to personalize your feed
          </p>
        </section>

        {/* Discover New Feeds Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-2xl">📡</span>
              Discover new feeds
            </h2>
            <Button variant="ghost" size="sm" className="text-[#0085ff]">
              See all
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEEDS.map((feed) => (
              <FeedCard
                key={feed.id}
                feed={feed}
                onPinToggle={handlePinToggle}
              />
            ))}
          </div>
        </section>

        {/* Trending Topics Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#0085ff]" />
              Trending
            </h2>
            <Button variant="ghost" size="sm" className="text-[#0085ff]">
              See all
            </Button>
          </div>
          <Card>
            <CardContent className="p-2 divide-y">
              {TRENDING_TOPICS.map((topic, index) => (
                <TrendingTopicCard
                  key={topic.id}
                  topic={topic}
                  rank={index + 1}
                />
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Suggested Users Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-2xl">👥</span>
              Suggested for you
            </h2>
            <Button variant="ghost" size="sm" className="text-[#0085ff]">
              See all
            </Button>
          </div>
          <Card>
            <CardContent className="p-2 divide-y max-h-96 overflow-y-auto">
              {SUGGESTED_USERS.map((user) => (
                <SuggestedUserCard key={user.id} user={user} />
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

export default ExplorePage;

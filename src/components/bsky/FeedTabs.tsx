'use client';

import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import type { FeedType } from '@/types';
import { X, TrendingUp } from 'lucide-react';

interface FeedTabsProps {
  className?: string;
  onTopicClick?: (topic: string) => void;
}

const tabs: { id: FeedType; label: string }[] = [
  { id: 'discover', label: 'Discover' },
  { id: 'following', label: 'Following' },
  { id: 'hot', label: "What's Hot" }
];

// Trending topics for the hidable bar
const trendingTopics = [
  { tag: 'Bluesky' },
  { tag: 'TechNews' },
  { tag: 'OpenWeb' },
  { tag: 'Decentralized' },
  { tag: 'SocialMedia' },
];

export function FeedTabs({ className, onTopicClick }: FeedTabsProps) {
  const { currentFeed, setCurrentFeed } = useAppStore();
  const [showTrending, setShowTrending] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      const maxScroll = scrollWidth - clientWidth;
      const progress = maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0;
      setScrollProgress(progress);
    }
  };

  const handleTopicClick = (topic: string) => {
    onTopicClick?.(topic);
  };

 return (
    <>
      {/* Main Tabs - EXACT bsky style - aligned with header icons - STICKY */}
      <div className={cn('sticky top-11 z-30 bg-white flex border-b border-gray-200 px-6', className)}>
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => setCurrentFeed(tab.id)}
            className={cn(
              'flex-1 py-3 text-[15px] font-semibold transition-colors relative',
              index === 0 ? 'text-left' : index === tabs.length - 1 ? 'text-right' : 'text-center',
              currentFeed === tab.id
                ? 'text-black tab-underline'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Trending Topics Bar - EXACT bsky.app style - NOT STICKY */}
      {showTrending && (
        <div className="bg-white border-b border-gray-200">
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex items-center gap-2 px-4 py-2 overflow-x-auto scrollbar-hide h-10"
          >
            <TrendingUp className="h-4 w-4 text-[#0085ff] shrink-0" />
            {trendingTopics.map((topic, idx) => (
              <button
                key={idx}
                onClick={() => handleTopicClick(topic.tag)}
                className="text-[14px] font-medium text-gray-700 whitespace-nowrap hover:text-[#0085ff] transition-colors"
              >
                #{topic.tag}
              </button>
            ))}
            <button
              onClick={() => setShowTrending(false)}
              className="p-1 hover:bg-gray-200 rounded-full shrink-0 ml-auto"
            >
              <X className="h-4 w-4 text-[#6b7280]" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

interface ProfileTabsProps {
  className?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const profileTabs: { id: string; label: string }[] = [
  { id: 'posts', label: 'Posts' },
  { id: 'replies', label: 'Replies' },
  { id: 'media', label: 'Media' },
  { id: 'likes', label: 'Likes' }
];

export function ProfileTabs({ className, activeTab = 'posts', onTabChange }: ProfileTabsProps) {
  return (
    <div className={cn('border-b border-gray-200 overflow-x-auto bg-white', className)}>
      <div className="flex">
        {profileTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange?.(tab.id)}
            className={cn(
              'px-5 py-3 text-center text-[15px] font-medium transition-colors relative whitespace-nowrap',
              activeTab === tab.id
                ? 'text-black tab-underline'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface NotificationTabsProps {
  className?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const notificationTabs: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'mentions', label: 'Mentions' }
];

export function NotificationTabs({ className, activeTab = 'all', onTabChange }: NotificationTabsProps) {
  return (
    <div className={cn('border-b border-gray-200 bg-white', className)}>
      <div className="flex">
        {notificationTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange?.(tab.id)}
            className={cn(
              'flex-1 py-3 text-center text-[15px] font-medium transition-colors relative',
              activeTab === tab.id
                ? 'text-black tab-underline'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

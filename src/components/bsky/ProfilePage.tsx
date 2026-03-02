'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store';
import { Post, PostSkeleton, FollowButton, ProfileTabs } from '@/components/bsky';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { User, Post as PostType } from '@/types';
import {
  Sparkles,
  MoreHorizontal,
  ArrowLeft
} from 'lucide-react';

interface ProfilePageProps {
  handle: string;
  onBack?: () => void;
}

interface ProfileUser extends User {
  isFollowing?: boolean;
}

export function ProfilePage({ handle, onBack }: ProfilePageProps) {
  const { user: currentUser, token } = useAuthStore();
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [userNotFound, setUserNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  const isOwnProfile = currentUser?.handle === handle;

  // Fetch user profile
  const fetchProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    setUserNotFound(false);
    try {
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`/api/user?handle=${handle}`, { headers });
      
      if (response.status === 404) {
        setUserNotFound(true);
        setProfileUser(null);
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setProfileUser(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setUserNotFound(true);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [handle, token]);

  // Fetch user's posts
  const fetchPosts = useCallback(async () => {
    if (!profileUser) return;
    
    setIsLoadingPosts(true);
    try {
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`/api/posts?userId=${profileUser.id}`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setIsLoadingPosts(false);
    }
  }, [profileUser, token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profileUser) fetchPosts();
  }, [profileUser, fetchPosts]);

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

  // User Not Found state
  if (userNotFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Sparkles className="h-10 w-10 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-black mb-2">User not found</h2>
        <p className="text-gray-500 mb-6">
          The user @{handle} doesn't exist or has been deactivated.
        </p>
        <Button 
          className="rounded-full bg-[#0085ff] hover:bg-[#0070e0]"
          onClick={() => window.location.hash = 'home'}
        >
          Go back home
        </Button>
      </div>
    );
  }

  // Loading state
  if (isLoadingProfile || !profileUser) {
    return (
      <>
        <div className="h-36 bg-gray-200 animate-pulse" />
        <div className="px-4 pb-4">
          <div className="-mt-12">
            <Skeleton className="h-[100px] w-[100px] rounded-full border-4 border-white" />
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="mt-3 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
        <ProfileTabs />
        <PostSkeleton />
        <PostSkeleton />
      </>
    );
  }

  const displayName = profileUser.displayName || profileUser.handle;

  return (
    <>
      {/* Banner - EXACT bsky size: h-36 (144px) with Back Button */}
      <div className="relative h-36 bg-gradient-to-r from-[#0085ff]/20 to-[#0085ff]/40">
        {profileUser.banner && (
          <img
            src={profileUser.banner}
            alt="Profile banner"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {/* Back Button on Banner */}
        <div className="absolute top-0 left-0 right-0 z-10">
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={onBack || (() => window.location.hash = 'home')}
              className="p-2 -ml-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Header Content - EXACT bsky layout */}
      <div className="px-4 pb-3">
        {/* Avatar and Actions Row */}
        <div className="flex justify-between items-start -mt-10">
          {/* Avatar - EXACT bsky size: 100px diameter with white border */}
          <Avatar className="h-[100px] w-[100px] border-4 border-white rounded-full">
            <AvatarImage src={profileUser.avatar || undefined} alt={displayName} />
            <AvatarFallback className="text-3xl">{displayName[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-12">
            {isOwnProfile ? (
              <Button 
                variant="outline" 
                className="rounded-full h-8 px-4 text-[14px] border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Edit Profile
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 rounded-full border-gray-300"
                >
                  <MoreHorizontal className="h-4 w-4 text-gray-700" />
                </Button>
                <FollowButton targetUser={profileUser} />
              </>
            )}
          </div>
        </div>

        {/* Name and Handle - EXACT bsky typography */}
        <div className="mt-3">
          <h1 className="text-xl font-bold text-black">{displayName}</h1>
          <p className="text-[15px] text-gray-500">@{profileUser.handle}</p>
        </div>

        {/* Followers/Following/Posts Stats - EXACT bsky sizes */}
        <div className="flex items-center gap-2 mt-2 text-[14px] text-gray-500">
          <button className="hover:underline">
            <span className="font-semibold text-black">{profileUser.followersCount}</span>
            <span className="ml-1">followers</span>
          </button>
          <span>·</span>
          <button className="hover:underline">
            <span className="font-semibold text-black">{profileUser.followingCount}</span>
            <span className="ml-1">following</span>
          </button>
          <span>·</span>
          <span>
            <span className="font-semibold text-black">{profileUser.postsCount}</span>
            <span className="ml-1">posts</span>
          </span>
        </div>

        {/* Bio - EXACT bsky size */}
        {profileUser.bio && (
          <p className="mt-3 text-[15px] text-black whitespace-pre-wrap leading-[1.35]">{profileUser.bio}</p>
        )}

        {/* Links Section - EXACT bsky style */}
        {profileUser.website && (
          <div className="mt-2 text-[15px]">
            <span className="text-black">• </span>
            <span className="text-black">Website: </span>
            <a
              href={profileUser.website.startsWith('http') ? profileUser.website : `https://${profileUser.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0085ff] hover:underline"
            >
              {profileUser.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
      </div>

      {/* Profile Tabs */}
      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <div className="min-h-[200px]">
        {isLoadingPosts ? (
          <>
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
              {activeTab === 'posts' && "This user hasn't posted anything yet."}
              {activeTab === 'replies' && "No replies to show."}
              {activeTab === 'media' && "No media posts to show."}
              {activeTab === 'likes' && "No liked posts to show."}
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <Post
              key={post.id}
              post={post}
              onLike={() => handleLike(post.id)}
              onRepost={() => handleRepost(post.id)}
              onBookmark={() => handleBookmark(post.id)}
            />
          ))
        )}
      </div>
    </>
  );
}

export default ProfilePage;

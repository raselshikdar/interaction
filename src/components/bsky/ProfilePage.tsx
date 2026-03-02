'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store';
import { Post, PostSkeleton, FollowButton, ProfileTabs } from '@/components/bsky';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import type { User, Post as PostType } from '@/types';
import {
  Sparkles,
  MoreHorizontal,
  ArrowLeft,
  X,
  Camera,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface ProfilePageProps {
  handle: string;
  onBack?: () => void;
}

interface ProfileUser extends User {
  isFollowing?: boolean;
}

// ─── Edit Profile Modal ───────────────────────────────────────────────────────
function EditProfileModal({
  user,
  token,
  onClose,
  onSave,
}: {
  user: ProfileUser;
  token: string | null;
  onClose: () => void;
  onSave: (updated: ProfileUser) => void;
}) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [bio, setBio] = useState(user.bio || '');
  const [website, setWebsite] = useState(user.website || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar || '');
  const [bannerUrl, setBannerUrl] = useState(user.banner || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) return data.url;
      setError(data.error || 'Upload failed');
      return null;
    } catch {
      setError('Upload failed');
      return null;
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    setError(null);
    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
    const url = await uploadFile(file);
    if (url) setAvatarUrl(url);
    setIsUploadingAvatar(false);
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBanner(true);
    setError(null);
    const preview = URL.createObjectURL(file);
    setBannerPreview(preview);
    const url = await uploadFile(file);
    if (url) setBannerUrl(url);
    setIsUploadingBanner(false);
  };

  const handleSave = async () => {
    if (!token) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName,
          bio,
          website,
          avatar: avatarUrl || user.avatar,
          banner: bannerUrl || user.banner,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          onSave({ ...user, displayName, bio, website, avatar: avatarUrl || user.avatar, banner: bannerUrl || user.banner });
          onClose();
        }, 800);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch {
      setError('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-background w-full sm:max-w-lg sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-background z-10 flex items-center justify-between px-4 py-3 border-b border-border">
          <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <X className="h-5 w-5 text-foreground" />
          </button>
          <h2 className="text-[17px] font-semibold text-foreground">Edit Profile</h2>
          <Button
            onClick={handleSave}
            disabled={isSaving || isUploadingAvatar || isUploadingBanner}
            className="h-8 px-4 bg-foreground text-background hover:opacity-80 rounded-full text-[14px] font-semibold"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : success ? <Check className="h-4 w-4" /> : 'Save'}
          </Button>
        </div>

        {/* Banner */}
        <div className="relative h-32 bg-muted cursor-pointer group" onClick={() => bannerRef.current?.click()}>
          {(bannerPreview || bannerUrl) && (
            <img
              src={bannerPreview || bannerUrl}
              alt="Banner"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
            {isUploadingBanner ? (
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            ) : (
              <Camera className="h-8 w-8 text-white" />
            )}
          </div>
          <input ref={bannerRef} type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
        </div>

        {/* Avatar on top of banner */}
        <div className="px-4 -mt-10 mb-2">
          <div className="relative inline-block cursor-pointer group" onClick={() => avatarRef.current?.click()}>
            <Avatar className="h-20 w-20 border-4 border-background rounded-full">
              <AvatarImage src={avatarPreview || avatarUrl || undefined} />
              <AvatarFallback className="text-2xl bg-muted text-muted-foreground">
                {(user.displayName || user.handle)[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
              {isUploadingAvatar ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </div>
            <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>
        </div>

        {/* Form Fields */}
        <div className="px-4 pb-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 rounded-lg text-[14px]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="text-[13px] text-muted-foreground">Display Name</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 h-10 text-[15px] border-border bg-background text-foreground focus-visible:ring-[#0085ff]"
              placeholder="Your display name"
              maxLength={64}
            />
          </div>

          <div>
            <label className="text-[13px] text-muted-foreground">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={256}
              className="mt-1 w-full px-3 py-2 text-[15px] text-foreground bg-background border border-border rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-[#0085ff] placeholder:text-muted-foreground"
              placeholder="Tell everyone a little about yourself"
            />
            <p className="text-right text-[12px] text-muted-foreground">{bio.length}/256</p>
          </div>

          <div>
            <label className="text-[13px] text-muted-foreground">Website</label>
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="mt-1 h-10 text-[15px] border-border bg-background text-foreground focus-visible:ring-[#0085ff]"
              placeholder="https://yourwebsite.com"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ProfilePage ──────────────────────────────────────────────────────────────
export function ProfilePage({ handle, onBack }: ProfilePageProps) {
  const router = useRouter();
  const { user: currentUser, token, setUser } = useAuthStore();
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [userNotFound, setUserNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [showEditModal, setShowEditModal] = useState(false);

  const isOwnProfile = currentUser?.handle === handle;

  useEffect(() => {
    setIsLoadingProfile(true);
    setUserNotFound(false);

    const fetchProfile = async () => {
      try {
        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch(`/api/user?handle=${handle}`, { headers });

        if (response.status === 404) {
          setUserNotFound(true);
          setProfileUser(null);
          setIsLoadingProfile(false);
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setProfileUser(data.user);
        } else {
          setUserNotFound(true);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setUserNotFound(true);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [handle, token]);

  useEffect(() => {
    if (!profileUser) {
      setPosts([]);
      setIsLoadingPosts(false);
      return;
    }
    
    setIsLoadingPosts(true);
    
    const fetchPosts = async () => {
      try {
        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch(`/api/posts?userId=${profileUser.id}`, { headers });
        if (response.ok) {
          const data = await response.json();
          setPosts(data.posts || []);
        }
      } catch (error) {
        console.error('[v0] Error fetching posts:', error);
        setPosts([]);
      } finally {
        setIsLoadingPosts(false);
      }
    };
    
    fetchPosts();
  }, [profileUser, token]);

  const handleLike = async (postId: string) => {
    if (!token) return;
    await fetch(`/api/posts/${postId}/like`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
  };
  const handleRepost = async (postId: string) => {
    if (!token) return;
    await fetch(`/api/posts/${postId}/repost`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
  };
  const handleBookmark = async (postId: string) => {
    if (!token) return;
    await fetch(`/api/posts/${postId}/bookmark`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
  };

  const handleProfileSaved = (updated: ProfileUser) => {
    setProfileUser(updated);
    // Also update the global auth store so the header avatar etc refreshes
    if (isOwnProfile) {
      setUser({ ...currentUser!, ...updated });
    }
  };

  if (userNotFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <Sparkles className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">User not found</h2>
        <p className="text-muted-foreground mb-6">The user @{handle} doesn't exist or has been deactivated.</p>
        <Button className="rounded-full bg-[#0085ff] hover:bg-[#0070e0]" onClick={() => router.push('/')}>
          Go back home
        </Button>
      </div>
    );
  }

  if (isLoadingProfile || !profileUser) {
    return (
      <>
        <div className="h-36 bg-muted animate-pulse" />
        <div className="px-4 pb-4">
          <div className="-mt-12">
            <Skeleton className="h-[100px] w-[100px] rounded-full border-4 border-background" />
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
      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal
          user={profileUser}
          token={token}
          onClose={() => setShowEditModal(false)}
          onSave={handleProfileSaved}
        />
      )}

      {/* Banner */}
      <div className="relative h-36 bg-gradient-to-r from-[#0085ff]/20 to-[#0085ff]/40">
        {profileUser.banner && (
          <img src={profileUser.banner} alt="Profile banner" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute top-0 left-0 right-0 z-10">
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={onBack || (() => router.push('/'))}
              className="p-2 -ml-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Header Content */}
      <div className="px-4 pb-3">
        <div className="flex justify-between items-start -mt-10">
          <Avatar className="h-[100px] w-[100px] border-4 border-background rounded-full">
            <AvatarImage src={profileUser.avatar || undefined} alt={displayName} />
            <AvatarFallback className="text-3xl">{displayName[0].toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="flex items-center gap-2 mt-12">
            {isOwnProfile ? (
              <Button
                variant="outline"
                onClick={() => setShowEditModal(true)}
                className="rounded-full h-8 px-4 text-[14px] border-border text-foreground hover:bg-muted"
              >
                Edit Profile
              </Button>
            ) : (
              <>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-border">
                  <MoreHorizontal className="h-4 w-4 text-foreground" />
                </Button>
                <FollowButton targetUser={profileUser} />
              </>
            )}
          </div>
        </div>

        <div className="mt-3">
          <h1 className="text-xl font-bold text-foreground">{displayName}</h1>
          <p className="text-[15px] text-muted-foreground">@{profileUser.handle}</p>
        </div>

        <div className="flex items-center gap-2 mt-2 text-[14px] text-muted-foreground">
          <button className="hover:underline">
            <span className="font-semibold text-foreground">{profileUser.followersCount}</span>
            <span className="ml-1">followers</span>
          </button>
          <span>·</span>
          <button className="hover:underline">
            <span className="font-semibold text-foreground">{profileUser.followingCount}</span>
            <span className="ml-1">following</span>
          </button>
          <span>·</span>
          <span>
            <span className="font-semibold text-foreground">{profileUser.postsCount}</span>
            <span className="ml-1">posts</span>
          </span>
        </div>

        {profileUser.bio && (
          <p className="mt-3 text-[15px] text-foreground whitespace-pre-wrap leading-[1.35]">{profileUser.bio}</p>
        )}

        {profileUser.website && (
          <div className="mt-2 text-[15px]">
            <span className="text-foreground">• </span>
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

      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="min-h-[200px]">
        {isLoadingPosts ? (
          <><PostSkeleton /><PostSkeleton /><PostSkeleton /></>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">No posts yet</h3>
            <p className="text-muted-foreground text-[14px]">
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
              onPostClick={(id) => router.push(`/post/${id}`)}
              onAuthorClick={(h) => router.push(`/profile/${h}`)}
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

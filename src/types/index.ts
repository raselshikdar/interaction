export interface User {
  id: string;
  email: string;
  handle: string;
  displayName: string | null;
  avatar: string | null;
  banner: string | null;
  bio: string | null;
  website: string | null;
  verified: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  content: string;
  images: string[] | null;
  video: string | null;
  link: string | null;
  linkCard: LinkCard | null;
  authorId: string;
  parentId: string | null;
  replyCount: number;
  repostCount: number;
  likeCount: number;
  bookmarkCount: number;
  isPinned: boolean;
  isReply: boolean;
  quotePostId: string | null;
  createdAt: string;
  updatedAt: string;
  author: User;
  parent?: Post;
  quotePost?: Post;
  isLiked?: boolean;
  isReposted?: boolean;
  isBookmarked?: boolean;
}

export interface LinkCard {
  url: string;
  title: string;
  description: string;
  image: string | null;
}

export interface Comment {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: User;
}

export interface Like {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
}

export interface Repost {
  id: string;
  postId: string;
  userId: string;
  content: string | null;
  createdAt: string;
}

export interface Bookmark {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'follow' | 'like' | 'repost' | 'reply' | 'mention' | 'quote';
  userId: string;
  actorId: string | null;
  postId: string | null;
  read: boolean;
  createdAt: string;
  actor?: User;
  post?: Post;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  read: boolean;
  readAt?: string;
  imageUrl?: string;
  imageAlt?: string;
  createdAt: string;
  sender: User;
  receiver: User;
}

export interface Feed {
  id: string;
  name: string;
  description: string | null;
  avatar: string | null;
  creatorId: string;
  isPublic: boolean;
  pinsCount: number;
  createdAt: string;
  updatedAt: string;
  creator: User;
}

export interface List {
  id: string;
  name: string;
  description: string | null;
  avatar: string | null;
  creatorId: string;
  isPublic: boolean;
  membersCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserInterest {
  id: string;
  userId: string;
  interest: string;
  createdAt: string;
}

export interface UserSettings {
  id: string;
  userId: string;
  
  // Privacy Settings
  isPrivate: boolean;
  showFollowers: boolean;
  showFollowing: boolean;
  allowTagging: boolean;
  allowMentions: boolean;
  showOnlineStatus: boolean;
  
  // Security Settings
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
  
  // Notification Settings
  pushNotifications: boolean;
  emailNotifications: boolean;
  notifyFollows: boolean;
  notifyLikes: boolean;
  notifyReposts: boolean;
  notifyReplies: boolean;
  notifyMentions: boolean;
  notifyQuotes: boolean;
  
  // Content Settings
  autoplayVideos: boolean;
  showSensitiveContent: boolean;
  mediaQuality: string;
  reduceMotion: boolean;
  
  // Appearance Settings
  theme: string;
  fontSize: string;
  compactMode: boolean;
  
  // Accessibility Settings
  screenReader: boolean;
  highContrast: boolean;
  reduceAnimations: boolean;
  
  // Language Settings
  language: string;
  
  createdAt: string;
  updatedAt: string;
}

export type FeedType = 'discover' | 'following' | 'hot';
export type ProfileTab = 'posts' | 'replies' | 'media' | 'likes';
export type NotificationTab = 'all' | 'mentions';

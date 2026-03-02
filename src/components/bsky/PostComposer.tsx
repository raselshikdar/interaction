'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore, useAppStore } from '@/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Image as ImageIcon,
  Film,
  Link2,
  ChevronDown,
  FileText,
  Loader2,
  X,
  Globe,
  Repeat2
} from 'lucide-react';

// Language options
const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'bn', name: 'Bangla' },
];

// Visibility options
const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Anyone can interact' },
  { value: 'followers', label: 'Followers only' },
  { value: 'mentioned', label: 'Only mentioned users' },
  { value: 'none', label: 'No replies' },
];

// GIF categories
const GIF_CATEGORIES = [
  '😂 Funny', '🎉 Celebration', '❤️ Love', '🔥 Fire',
  '👏 Applause', '🤔 Thinking', '😢 Sad', '😎 Cool',
  '👍 Thumbs Up', '🙌 Yay', '😮 Wow', '🤣 LOL'
];

// Extract entities from text
function extractEntities(text: string) {
  const hashtags: string[] = [];
  const mentions: string[] = [];
  const urls: string[] = [];

  // Extract hashtags
  const hashtagRegex = /#(\w+)/g;
  let match;
  while ((match = hashtagRegex.exec(text)) !== null) {
    hashtags.push(match[1]);
  }

  // Extract mentions
  const mentionRegex = /@(\w+)/g;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }

  // Extract URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  while ((match = urlRegex.exec(text)) !== null) {
    urls.push(match[1]);
  }

  return { hashtags, mentions, urls };
}

// Highlight text with entities
function highlightText(text: string) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  // Combined regex for all entities
  const regex = /(#\w+|@\w+|https?:\/\/[^\s]+)/g;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
    }

    const entity = match[0];
    
    if (entity.startsWith('#')) {
      // Hashtag - blue
      parts.push(
        <span key={key++} className="text-[#0085ff] font-medium">{entity}</span>
      );
    } else if (entity.startsWith('@')) {
      // Mention - blue
      parts.push(
        <span key={key++} className="text-[#0085ff] font-medium">{entity}</span>
      );
    } else {
      // URL - blue and underlined
      parts.push(
        <span key={key++} className="text-[#0085ff] underline">{entity}</span>
      );
    }

    lastIndex = match.index + entity.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : text;
}

export function PostComposer() {
  const { user, isAuthenticated, token } = useAuthStore();
  const { composerOpen, setComposerOpen, replyTo, setReplyTo, quotePost, setQuotePost } = useAppStore();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [language, setLanguage] = useState('en');
  const [visibility, setVisibility] = useState('public');
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionUsers, setMentionUsers] = useState<{id: string; handle: string; displayName: string | null; avatar: string | null}[]>([]);
  const [mentionPosition, setMentionPosition] = useState({ start: 0, end: 0 });
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);
  const [linkPreview, setLinkPreview] = useState<{title: string; description: string; image: string} | null>(null);
  const [isRepost, setIsRepost] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  // Focus textarea when composer opens
  useEffect(() => {
    if (composerOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [composerOpen]);

  // Prevent body scroll when composer is open
  useEffect(() => {
    if (composerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [composerOpen]);

  // Reset state when composer closes
  useEffect(() => {
    if (!composerOpen) {
      setUploadError(null);
      setDetectedUrl(null);
      setLinkPreview(null);
      setIsRepost(false);
    }
  }, [composerOpen]);

  // Search users for mentions
  const searchUsers = useCallback(async (query: string) => {
    if (!query || query.length < 1) {
      setMentionUsers([]);
      return;
    }
    
    try {
      const response = await fetch(`/api/user?search=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMentionUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  }, [token]);

  // Handle text changes and detect entities
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setContent(newText);

    // Check for @mention being typed
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = newText.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
      setMentionPosition({
        start: cursorPos - mentionMatch[0].length,
        end: cursorPos
      });
      searchUsers(mentionMatch[1]);
    } else {
      setShowMentions(false);
    }

    // Check for URLs
    const entities = extractEntities(newText);
    if (entities.urls.length > 0) {
      const url = entities.urls[entities.urls.length - 1];
      setDetectedUrl(url);
      // Could fetch link preview here
    } else {
      setDetectedUrl(null);
    }
  };

  // Insert mention
  const insertMention = (handle: string) => {
    const before = content.slice(0, mentionPosition.start);
    const after = content.slice(mentionPosition.end);
    const newContent = `${before}@${handle} ${after}`;
    setContent(newContent);
    setShowMentions(false);
    
    // Focus back on textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = before.length + handle.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const maxLength = 300;
  const remaining = maxLength - content.length;
  const isValid = (content.trim().length > 0 || images.length > 0) && remaining >= 0;

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length >= 4) {
      setUploadError('Maximum 4 images allowed');
      return;
    }

    const file = files[0];
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid file type. Use JPEG, PNG, GIF, or WebP');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File too large. Maximum 5MB allowed');
      return;
    }

    if (!token) {
      setUploadError('You must be logged in to upload images');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.url) {
        setImages(prev => [...prev, data.url]);
      } else {
        setUploadError(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle post submission
  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    
    const entities = extractEntities(content);
    
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: content.trim(),
          images: images.length > 0 ? images : undefined,
          parentId: replyTo?.id || undefined,
          quotePostId: quotePost?.id || undefined,
          language,
          visibility,
          hashtags: entities.hashtags,
          mentions: entities.mentions,
          isRepost
        })
      });

      if (response.ok) {
        setContent('');
        setImages([]);
        setReplyTo(null);
        setQuotePost(null);
        setComposerOpen(false);
        setIsRepost(false);
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create post');
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (content.trim() || images.length > 0) {
      if (confirm('Discard this post?')) {
        setContent('');
        setImages([]);
        setReplyTo(null);
        setQuotePost(null);
        setComposerOpen(false);
        setIsRepost(false);
      }
    } else {
      setComposerOpen(false);
      setReplyTo(null);
      setQuotePost(null);
      setIsRepost(false);
    }
  };

  const currentVisibility = VISIBILITY_OPTIONS.find(v => v.value === visibility) || VISIBILITY_OPTIONS[0];
  const currentLanguage = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  const progress = Math.min(content.length / maxLength, 1);
  const circumference = 2 * Math.PI * 10;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
      />

      {composerOpen && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/30" onClick={handleClose} />
          
          <div 
            className="absolute top-[8vh] left-0 right-0 bg-background shadow-2xl animate-slide-up rounded-b-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <button onClick={handleClose} className="text-[#0085ff] text-[15px] font-medium hover:opacity-70">
                Cancel
              </button>
              
              <button className="text-[#0085ff] text-[15px] font-medium flex items-center gap-1.5 hover:opacity-70">
                <FileText className="h-4 w-4" />
                Drafts
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={!isValid || isSubmitting}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[15px] font-medium transition-colors",
                  isValid && !isSubmitting
                    ? "bg-[#0085ff] text-white hover:bg-[#0070e0]"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </button>
            </div>

            {/* Repost indicator */}
            {isRepost && (
              <div className="px-4 py-2 bg-muted flex items-center gap-2 text-[13px] text-muted-foreground">
                <Repeat2 className="h-4 w-4" />
                <span>This is a repost with quote</span>
                <button 
                  onClick={() => setIsRepost(false)}
                  className="ml-auto text-[#0085ff] text-[13px]"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Reply/Quote context */}
            {replyTo && (
              <div className="px-4 pt-3 flex items-center gap-2 text-[14px] text-muted-foreground">
                <span>Replying to</span>
                <span className="text-[#0085ff]">@{replyTo.author.handle}</span>
                <button onClick={() => setReplyTo(null)} className="ml-auto p-1 hover:bg-gray-100 rounded-full">
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            )}

            {quotePost && (
              <div className="px-4 pt-3">
                  <div className="border border-border rounded-lg p-2.5 relative bg-muted">
                  <button 
                    onClick={() => setQuotePost(null)}
                    className="absolute right-2 top-2 p-1 hover:bg-gray-200 rounded-full"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                  <div className="flex items-center gap-2 pr-6">
                    <Avatar className="h-5 w-5 rounded-full">
                      <AvatarImage src={quotePost.author.avatar || undefined} />
                      <AvatarFallback>{quotePost.author.handle[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-[13px] font-medium">{quotePost.author.displayName || quotePost.author.handle}</span>
                  </div>
                  <p className="text-[13px] text-muted-foreground mt-1 line-clamp-3">{quotePost.content}</p>
                  {quotePost.images && quotePost.images[0] && (
                    <img src={quotePost.images[0]} alt="" className="mt-2 rounded max-h-32 object-cover" />
                  )}
                </div>
              </div>
            )}

            {/* Main composer area */}
            <div className="px-4 py-3">
              <div className="flex gap-3">
                <Avatar className="h-10 w-10 rounded-full shrink-0">
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback className="bg-[#0085ff] text-white text-sm font-medium">
                    {(user.displayName || user.handle)[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 relative">
                  {/* Text area with highlighted overlay */}
                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      placeholder="What's up?"
                      value={content}
                      onChange={handleTextChange}
                      className="w-full border-0 resize-none text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[80px] leading-[1.4] bg-transparent"
                      maxLength={maxLength}
                      rows={3}
                    />
                  </div>

                  {/* Mention autocomplete dropdown */}
                  {showMentions && mentionUsers.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                      {mentionUsers.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => insertMention(u.handle)}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left"
                        >
                          <Avatar className="h-8 w-8 rounded-full">
                            <AvatarImage src={u.avatar || undefined} />
                            <AvatarFallback>{u.handle[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-[14px] font-medium text-foreground">{u.displayName || u.handle}</div>
                            <div className="text-[12px] text-muted-foreground">@{u.handle}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Detected URL preview */}
                  {detectedUrl && (
                    <div className="mt-2 p-2 bg-muted rounded-lg flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-gray-400" />
                      <span className="text-[13px] text-muted-foreground truncate flex-1">{detectedUrl}</span>
                      <button 
                        onClick={() => setDetectedUrl(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {/* Upload error */}
                  {uploadError && (
                    <div className="mt-2 p-2 bg-red-50 text-red-600 text-[13px] rounded-lg flex items-center justify-between">
                      <span>{uploadError}</span>
                      <button onClick={() => setUploadError(null)} className="p-1 hover:bg-red-100 rounded">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {/* Image previews */}
                  {images.length > 0 && (
                    <div className={cn(
                      "mt-2 grid gap-1.5",
                      images.length === 1 ? "grid-cols-1" : "grid-cols-2"
                    )}>
                      {images.map((img, idx) => (
                        <div key={idx} className="relative rounded-lg overflow-hidden aspect-square group bg-gray-100">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <button
                            onClick={() => setImages(images.filter((_, i) => i !== idx))}
                            className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Uploading indicator */}
                  {isUploading && (
                    <div className="mt-2 flex items-center gap-2 text-[13px] text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Uploading image...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Visibility settings row */}
            <div className="px-4 py-2 border-t border-border">
              <Popover open={showVisibilityMenu} onOpenChange={setShowVisibilityMenu}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground">
                    <Globe className="h-4 w-4" />
                    <span>{currentVisibility.label}</span>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-1.5" align="start" sideOffset={5}>
                  {VISIBILITY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setVisibility(option.value);
                        setShowVisibilityMenu(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-[14px] text-black",
                        visibility === option.value
                          ? "bg-[#0085ff]/10 text-[#0085ff]"
                          : "hover:bg-gray-100"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            </div>

            {/* Bottom toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-border">
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || images.length >= 4}
                  className={cn(
                    "p-2 rounded-full hover:bg-gray-100 text-[#0085ff]",
                    (isUploading || images.length >= 4) && "opacity-50 cursor-not-allowed"
                  )}
                  title="Add image"
                >
                  <ImageIcon className="h-5 w-5" />
                </button>

                <Popover open={showGifPicker} onOpenChange={setShowGifPicker}>
                  <PopoverTrigger asChild>
                    <button className="px-2.5 py-1.5 rounded-md hover:bg-gray-100 text-[#0085ff] text-[12px] font-bold" title="Add GIF">
                      GIF
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-3" align="start" sideOffset={5}>
                    <div className="mb-2">
                      <h3 className="text-[14px] font-semibold text-black">Choose a GIF</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {GIF_CATEGORIES.map((category) => (
                        <button
                          key={category}
                          onClick={() => setShowGifPicker(false)}
                          className="px-3 py-2 text-[13px] text-left rounded-lg hover:bg-gray-100 text-black border border-gray-200"
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <button className="p-2 rounded-full hover:bg-gray-100 text-[#0085ff]" title="Add video">
                  <Film className="h-5 w-5" />
                </button>

                <button className="p-2 rounded-full hover:bg-gray-100 text-[#0085ff]" title="Add link">
                  <Link2 className="h-5 w-5" />
                </button>

                {/* Repost button */}
                <button 
                  onClick={() => setIsRepost(!isRepost)}
                  className={cn(
                    "p-2 rounded-full hover:bg-gray-100",
                    isRepost ? "text-green-500" : "text-[#0085ff]"
                  )}
                  title="Quote repost"
                >
                  <Repeat2 className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                <Popover open={showLanguageMenu} onOpenChange={setShowLanguageMenu}>
                  <PopoverTrigger asChild>
                    <button className="text-[#0085ff] text-[14px] hover:opacity-70">
                      {currentLanguage.name}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-44 p-1.5 max-h-60 overflow-y-auto" align="end" sideOffset={5}>
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setShowLanguageMenu(false);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-[14px] text-black",
                          language === lang.code
                            ? "bg-[#0085ff]/10 text-[#0085ff]"
                            : "hover:bg-gray-100"
                        )}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>

                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    'text-[14px]',
                    remaining < 0 ? 'text-red-500' : remaining <= 20 ? 'text-orange-500' : 'text-foreground'
                  )}>
                    {remaining}
                  </span>
                  <div className="w-5 h-5">
                    <svg className="w-5 h-5 -rotate-90" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" fill="none" stroke="#e5e7eb" strokeWidth="2" />
                      <circle
                        cx="12" cy="12" r="10"
                        fill="none"
                        stroke={remaining < 0 ? "#ef4444" : remaining <= 20 ? "#f97316" : "#0085ff"}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={remaining < 0 ? 0 : strokeDashoffset}
                        className="transition-all duration-150"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

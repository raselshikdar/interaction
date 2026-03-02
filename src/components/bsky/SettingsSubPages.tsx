'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store';
import { useUserSettings } from '@/providers/UserSettingsProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft,
  ChevronRight,
  User,
  Mail,
  AtSign,
  Lock,
  Shield,
  Eye,
  EyeOff,
  Users,
  Tag,
  MessageCircle,
  Bell,
  Smartphone,
  Mail as MailIcon,
  Heart,
  Repeat2,
  MessageSquare,
  AtSign as AtSignIcon,
  Quote,
  Play,
  AlertTriangle,
  Monitor,
  Moon,
  Sun,
  Type,
  Layout,
  Accessibility,
  Contrast,
  Zap,
  Globe,
  Check,
  Trash2,
  LogOut,
  X,
  Plus,
  ExternalLink,
  AlertCircle,
  UserPlus
} from 'lucide-react';

// Toggle Switch Component
function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: (enabled: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative w-11 h-6 rounded-full transition-colors",
        enabled ? "bg-[#0085ff]" : "bg-gray-300"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
          enabled && "translate-x-5"
        )}
      />
    </button>
  );
}

// Settings Item with Toggle
function SettingsToggleItem({ 
  label, 
  description, 
  enabled, 
  onChange 
}: { 
  label: string; 
  description?: string; 
  enabled: boolean; 
  onChange: (enabled: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-[15px] text-foreground">{label}</p>
        {description && (
          <p className="text-[13px] text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <ToggleSwitch enabled={enabled} onChange={onChange} />
    </div>
  );
}

// Settings Item with Arrow
function SettingsNavItem({ 
  label, 
  description, 
  onClick,
  isDestructive = false
}: { 
  label: string; 
  description?: string; 
  onClick: () => void;
  isDestructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3.5 border-b border-border hover:bg-muted transition-colors"
    >
      <div className="flex-1 min-w-0 text-left">
        <p className={cn("text-[15px]", isDestructive ? "text-red-500" : "text-foreground")}>{label}</p>
        {description && (
          <p className="text-[13px] text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
    </button>
  );
}

// Header Component
function SettingsHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };
  
  return (
    <div className="sticky top-0 z-20 bg-background border-b border-border">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 rounded-full hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-[17px] font-semibold text-foreground">{title}</h1>
      </div>
    </div>
  );
}

// Modal Component
function Modal({ isOpen, onClose, title, children }: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-background rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-[17px] font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-muted">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(80vh-60px)]">
          {children}
        </div>
      </div>
    </div>
  );
}

// Change Password Modal
function ChangePasswordModal({ isOpen, onClose, token }: { 
  isOpen: boolean; 
  onClose: () => void;
  token: string | null;
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setSuccess(false);
        }, 1500);
      } else {
        setError(data.error || 'Failed to change password');
      }
    } catch (err) {
      setError('Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Password">
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-[14px]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-[14px]">
            <Check className="h-4 w-4 shrink-0" />
            Password changed successfully!
          </div>
        )}

        <div>
          <label className="text-[13px] text-gray-500">Current Password</label>
          <div className="relative mt-1">
            <Input
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="pr-10 h-10 text-[15px] border-gray-200 focus-visible:ring-[#0085ff]"
              placeholder="Enter current password"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-[13px] text-gray-500">New Password</label>
          <div className="relative mt-1">
            <Input
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pr-10 h-10 text-[15px] border-gray-200 focus-visible:ring-[#0085ff]"
              placeholder="Enter new password"
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-[13px] text-gray-500">Confirm New Password</label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 h-10 text-[15px] border-gray-200 focus-visible:ring-[#0085ff]"
            placeholder="Confirm new password"
            required
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 bg-[#0085ff] hover:bg-[#0070e0] text-white rounded-full text-[15px] font-medium"
        >
          {isLoading ? 'Updating...' : 'Change Password'}
        </Button>
      </form>
    </Modal>
  );
}

// Blocked Account Item
function BlockedAccountItem({ 
  user, 
  onUnblock 
}: { 
  user: { id: string; handle: string; displayName: string | null; avatar: string | null };
  onUnblock: () => void;
}) {
  const [isUnblocking, setIsUnblocking] = useState(false);

  const handleUnblock = async () => {
    setIsUnblocking(true);
    await onUnblock();
    setIsUnblocking(false);
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
      <Avatar className="h-10 w-10 rounded-full">
        <AvatarImage src={user.avatar || undefined} />
        <AvatarFallback>{(user.displayName || user.handle)[0].toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-black truncate">{user.displayName || user.handle}</p>
        <p className="text-[13px] text-gray-500 truncate">@{user.handle}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleUnblock}
        disabled={isUnblocking}
        className="rounded-full text-[13px] h-8 px-4 border-gray-300 text-black hover:bg-gray-100"
      >
        {isUnblocking ? 'Unblocking...' : 'Unblock'}
      </Button>
    </div>
  );
}

// Muted Account Item
function MutedAccountItem({ 
  user, 
  onUnmute 
}: { 
  user: { id: string; handle: string; displayName: string | null; avatar: string | null };
  onUnmute: () => void;
}) {
  const [isUnmuting, setIsUnmuting] = useState(false);

  const handleUnmute = async () => {
    setIsUnmuting(true);
    await onUnmute();
    setIsUnmuting(false);
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
      <Avatar className="h-10 w-10 rounded-full">
        <AvatarImage src={user.avatar || undefined} />
        <AvatarFallback>{(user.displayName || user.handle)[0].toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-black truncate">{user.displayName || user.handle}</p>
        <p className="text-[13px] text-gray-500 truncate">@{user.handle}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleUnmute}
        disabled={isUnmuting}
        className="rounded-full text-[13px] h-8 px-4 border-gray-300 text-black hover:bg-gray-100"
      >
        {isUnmuting ? 'Unmuting...' : 'Unmute'}
      </Button>
    </div>
  );
}

// Muted Word Item
function MutedWordItem({ 
  word, 
  onRemove 
}: { 
  word: string;
  onRemove: () => void;
}) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    await onRemove();
    setIsRemoving(false);
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
      <span className="text-[15px] text-black">#{word}</span>
      <button
        onClick={handleRemove}
        disabled={isRemoving}
        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// Account Settings Page
export function AccountSettingsPage({ onBack }: { onBack?: () => void }) {
  const { user, token, setUser, logout } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [handle, setHandle] = useState(user?.handle || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!token) return;
    setIsSaving(true);
    setMessage(null);

    try {
      // If there's a new avatar, upload it first
      let avatarUrl = user?.avatar;
      if (avatarFile && avatarPreview) {
        // For now, use the base64 preview as the avatar URL
        // In production, you'd upload to a storage service
        avatarUrl = avatarPreview;
      }

      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          displayName,
          bio,
          website,
          handle,
          email,
          avatar: avatarUrl
        })
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setAvatarFile(null);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!token) return;
    setIsDeleting(true);
    try {
      const response = await fetch('/api/user', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        logout();
        window.location.href = '/';
      } else {
        setMessage({ type: 'error', text: 'Failed to delete account' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete account' });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <SettingsHeader title="Account" onBack={onBack} />

      {/* Avatar Section */}
      <div className="flex flex-col items-center py-6 border-b border-border">
        <div className="relative">
          <Avatar className="h-20 w-20 rounded-full">
            <AvatarImage src={avatarPreview || user?.avatar || undefined} />
            <AvatarFallback className="text-2xl">{(user?.displayName || user?.handle || 'U')[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <label className="absolute bottom-0 right-0 bg-[#0085ff] text-white rounded-full p-2 cursor-pointer hover:bg-[#0070e0] transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <Plus className="h-4 w-4" />
          </label>
        </div>
        <p className="mt-3 text-[13px] text-gray-500">Tap to change avatar</p>
      </div>

      {/* Form Fields */}
      <div className="divide-y divide-border">
        <div className="px-4 py-3">
          <label className="text-[13px] text-muted-foreground">Display Name</label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 h-10 text-[15px] border-gray-200 focus-visible:ring-[#0085ff]"
            placeholder="Your display name"
          />
        </div>

        <div className="px-4 py-3">
          <label className="text-[13px] text-gray-500">Handle</label>
          <div className="relative mt-1">
            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="pl-9 h-10 text-[15px] border-gray-200 focus-visible:ring-[#0085ff]"
              placeholder="your.handle"
            />
          </div>
        </div>

        <div className="px-4 py-3">
          <label className="text-[13px] text-muted-foreground">Email</label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9 h-10 text-[15px] border-gray-200 focus-visible:ring-[#0085ff]"
              placeholder="your@email.com"
            />
          </div>
        </div>

        <div className="px-4 py-3">
          <label className="text-[13px] text-muted-foreground">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="mt-1 w-full h-24 px-3 py-2 text-[15px] text-foreground bg-background border border-border rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-[#0085ff]"
            placeholder="Tell us about yourself..."
          />
        </div>

        <div className="px-4 py-3">
          <label className="text-[13px] text-muted-foreground">Website</label>
          <Input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="mt-1 h-10 text-[15px] border-gray-200 focus-visible:ring-[#0085ff]"
            placeholder="https://yourwebsite.com"
          />
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={cn(
          "mx-4 mt-4 p-3 rounded-lg text-[14px]",
          message.type === 'success' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        )}>
          {message.text}
        </div>
      )}

      {/* Save Button */}
      <div className="p-4">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full h-11 bg-[#0085ff] hover:bg-[#0070e0] text-white rounded-full text-[15px] font-medium"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Delete Account */}
      <div className="border-t border-gray-200 mt-4">
        <div className="px-4 py-2 bg-muted">
          <h2 className="text-[13px] font-medium text-muted-foreground uppercase">Danger Zone</h2>
        </div>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="h-5 w-5 text-red-500" />
          <span className="text-[15px] text-red-500">Delete Account</span>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Account">
        <div className="p-4">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-center text-[15px] text-gray-700 mb-4">
            Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 h-11 rounded-full border-gray-300 text-black"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="flex-1 h-11 bg-red-500 hover:bg-red-600 text-white rounded-full"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Privacy & Security Settings Page
export function PrivacySecuritySettingsPage({ onBack }: { onBack?: () => void }) {
  const { token } = useAuthStore();
  const { settings, isLoading, updateSetting } = useUserSettings();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [showMutedUsers, setShowMutedUsers] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [mutedUsers, setMutedUsers] = useState<any[]>([]);

  const fetchBlockedUsers = async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/user/blocks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setBlockedUsers(data.blocks);
      }
    } catch (error) {
      console.error('Failed to fetch blocked users:', error);
    }
  };

  const fetchMutedUsers = async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/user/mutes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMutedUsers(data.mutes);
      }
    } catch (error) {
      console.error('Failed to fetch muted users:', error);
    }
  };

  const handleUnblock = async (userId: string) => {
    if (!token) return;
    try {
      await fetch(`/api/user/blocks?userId=${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setBlockedUsers(prev => prev.filter(b => b.user?.id !== userId));
    } catch (error) {
      console.error('Failed to unblock user:', error);
    }
  };

  const handleUnmute = async (userId: string) => {
    if (!token) return;
    try {
      await fetch(`/api/user/mutes?userId=${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMutedUsers(prev => prev.filter(m => m.user?.id !== userId));
    } catch (error) {
      console.error('Failed to unmute user:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen">
        <SettingsHeader title="Privacy and Security" onBack={onBack} />
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 border-2 border-gray-300 border-t-[#0085ff] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Blocked Users View
  if (showBlockedUsers) {
    return (
      <div className="bg-background min-h-screen">
        <SettingsHeader 
          title="Blocked Accounts" 
          onBack={() => setShowBlockedUsers(false)} 
        />
        {blockedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-[15px] text-gray-500 text-center">You haven't blocked any accounts yet.</p>
          </div>
        ) : (
          <div>
            {blockedUsers.map((block) => (
              <BlockedAccountItem
                key={block.id}
                user={block.user}
                onUnblock={() => handleUnblock(block.user.id)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Muted Users View
  if (showMutedUsers) {
    return (
      <div className="bg-background min-h-screen">
        <SettingsHeader 
          title="Muted Accounts" 
          onBack={() => setShowMutedUsers(false)} 
        />
        {mutedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-[15px] text-gray-500 text-center">You haven't muted any accounts yet.</p>
          </div>
        ) : (
          <div>
            {mutedUsers.map((mute) => (
              <MutedAccountItem
                key={mute.id}
                user={mute.user}
                onUnmute={() => handleUnmute(mute.user.id)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <SettingsHeader title="Privacy and Security" onBack={onBack} />

      {/* Privacy Section */}
      <div className="border-t border-border">
        <div className="px-4 py-2 bg-muted">
          <h2 className="text-[13px] font-medium text-muted-foreground uppercase">Privacy</h2>
        </div>
        
        <SettingsToggleItem
          label="Private Account"
          description="Only approved followers can see your posts"
          enabled={settings?.isPrivate || false}
          onChange={(v) => updateSetting('isPrivate', v)}
        />
        
        <SettingsToggleItem
          label="Show Followers"
          description="Allow others to see who follows you"
          enabled={settings?.showFollowers ?? true}
          onChange={(v) => updateSetting('showFollowers', v)}
        />
        
        <SettingsToggleItem
          label="Show Following"
          description="Allow others to see who you follow"
          enabled={settings?.showFollowing ?? true}
          onChange={(v) => updateSetting('showFollowing', v)}
        />
        
        <SettingsToggleItem
          label="Allow Tagging"
          description="Allow others to tag you in posts"
          enabled={settings?.allowTagging ?? true}
          onChange={(v) => updateSetting('allowTagging', v)}
        />
        
        <SettingsToggleItem
          label="Allow Mentions"
          description="Allow others to mention you"
          enabled={settings?.allowMentions ?? true}
          onChange={(v) => updateSetting('allowMentions', v)}
        />
        
        <SettingsToggleItem
          label="Show Online Status"
          description="Show when you're active"
          enabled={settings?.showOnlineStatus ?? true}
          onChange={(v) => updateSetting('showOnlineStatus', v)}
        />
      </div>

      {/* Security Section */}
      <div className="border-t border-border">
        <div className="px-4 py-2 bg-muted">
          <h2 className="text-[13px] font-medium text-muted-foreground uppercase">Security</h2>
        </div>
        
        <SettingsNavItem
          label="Change Password"
          description="Update your password"
          onClick={() => setShowPasswordModal(true)}
        />
        
        <SettingsToggleItem
          label="Two-Factor Authentication"
          description="Add an extra layer of security"
          enabled={settings?.twoFactorEnabled || false}
          onChange={(v) => updateSetting('twoFactorEnabled', v)}
        />
        
        <SettingsToggleItem
          label="Login Alerts"
          description="Get notified of new logins"
          enabled={settings?.loginAlerts ?? true}
          onChange={(v) => updateSetting('loginAlerts', v)}
        />
      </div>

      {/* Blocked/Muted */}
      <div className="border-t border-border">
        <div className="px-4 py-2 bg-muted">
          <h2 className="text-[13px] font-medium text-muted-foreground uppercase">Blocked & Muted</h2>
        </div>
        
        <SettingsNavItem
          label="Blocked Accounts"
          description="Manage blocked accounts"
          onClick={() => {
            fetchBlockedUsers();
            setShowBlockedUsers(true);
          }}
        />
        
        <SettingsNavItem
          label="Muted Accounts"
          description="Manage muted accounts"
          onClick={() => {
            fetchMutedUsers();
            setShowMutedUsers(true);
          }}
        />
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)}
        token={token}
      />
    </div>
  );
}

// Notifications Settings Page
export function NotificationsSettingsPage({ onBack }: { onBack?: () => void }) {
  const { settings, isLoading, updateSetting } = useUserSettings();

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen">
        <SettingsHeader title="Notifications" onBack={onBack} />
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 border-2 border-gray-300 border-t-[#0085ff] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <SettingsHeader title="Notifications" onBack={onBack} />

      {/* General */}
      <div className="border-t border-border">
        <div className="px-4 py-2 bg-muted">
          <h2 className="text-[13px] font-medium text-muted-foreground uppercase">General</h2>
        </div>
        
        <SettingsToggleItem
          label="Push Notifications"
          description="Receive push notifications"
          enabled={settings?.pushNotifications ?? true}
          onChange={(v) => updateSetting('pushNotifications', v)}
        />
        
        <SettingsToggleItem
          label="Email Notifications"
          description="Receive email notifications"
          enabled={settings?.emailNotifications ?? true}
          onChange={(v) => updateSetting('emailNotifications', v)}
        />
      </div>

      {/* Activity */}
      <div className="border-t border-border">
        <div className="px-4 py-2 bg-muted">
          <h2 className="text-[13px] font-medium text-muted-foreground uppercase">Activity</h2>
        </div>
        
        <SettingsToggleItem
          label="New Followers"
          description="When someone follows you"
          enabled={settings?.notifyFollows ?? true}
          onChange={(v) => updateSetting('notifyFollows', v)}
        />
        
        <SettingsToggleItem
          label="Likes"
          description="When someone likes your post"
          enabled={settings?.notifyLikes ?? true}
          onChange={(v) => updateSetting('notifyLikes', v)}
        />
        
        <SettingsToggleItem
          label="Reposts"
          description="When someone reposts your post"
          enabled={settings?.notifyReposts ?? true}
          onChange={(v) => updateSetting('notifyReposts', v)}
        />
        
        <SettingsToggleItem
          label="Replies"
          description="When someone replies to your post"
          enabled={settings?.notifyReplies ?? true}
          onChange={(v) => updateSetting('notifyReplies', v)}
        />
        
        <SettingsToggleItem
          label="Mentions"
          description="When someone mentions you"
          enabled={settings?.notifyMentions ?? true}
          onChange={(v) => updateSetting('notifyMentions', v)}
        />
        
        <SettingsToggleItem
          label="Quotes"
          description="When someone quotes your post"
          enabled={settings?.notifyQuotes ?? true}
          onChange={(v) => updateSetting('notifyQuotes', v)}
        />
      </div>
    </div>
  );
}

// Content & Media Settings Page
export function ContentMediaSettingsPage({ onBack }: { onBack?: () => void }) {
  const { settings, isLoading, updateSetting } = useUserSettings();

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen">
        <SettingsHeader title="Content and Media" onBack={onBack} />
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 border-2 border-gray-300 border-t-[#0085ff] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <SettingsHeader title="Content and Media" onBack={onBack} />

      {/* Media */}
      <div className="border-t border-border">
        <div className="px-4 py-2 bg-muted">
          <h2 className="text-[13px] font-medium text-muted-foreground uppercase">Media</h2>
        </div>
        
        <SettingsToggleItem
          label="Autoplay Videos"
          description="Automatically play videos in feed"
          enabled={settings?.autoplayVideos ?? true}
          onChange={(v) => updateSetting('autoplayVideos', v)}
        />
        
        <SettingsToggleItem
          label="Show Sensitive Content"
          description="Display content marked as sensitive"
          enabled={settings?.showSensitiveContent || false}
          onChange={(v) => updateSetting('showSensitiveContent', v)}
        />
        
        <SettingsToggleItem
          label="Reduce Motion"
          description="Minimize animations"
          enabled={settings?.reduceMotion || false}
          onChange={(v) => updateSetting('reduceMotion', v)}
        />
      </div>

      {/* Media Quality */}
      <div className="border-t border-border">
        <div className="px-4 py-2 bg-muted">
          <h2 className="text-[13px] font-medium text-muted-foreground uppercase">Media Quality</h2>
        </div>
        
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-[15px] text-black mb-3">Image & Video Quality</p>
          <div className="flex gap-2">
            {['low', 'auto', 'high'].map((quality) => (
              <button
                key={quality}
                onClick={() => updateSetting('mediaQuality', quality)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-[14px] font-medium transition-colors",
                  settings?.mediaQuality === quality
                    ? "bg-[#0085ff] text-white"
                    : "bg-muted text-muted-foreground hover:opacity-80"
                )}
              >
                {quality.charAt(0).toUpperCase() + quality.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Appearance Settings Page
export function AppearanceSettingsPage({ onBack }: { onBack?: () => void }) {
  const { settings, isLoading, updateSetting } = useUserSettings();

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen">
        <SettingsHeader title="Appearance" onBack={onBack} />
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 border-2 border-gray-300 border-t-[#0085ff] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <SettingsHeader title="Appearance" onBack={onBack} />

      {/* Theme */}
      <div className="border-t border-border">
        <div className="px-4 py-2 bg-muted">
          <h2 className="text-[13px] font-medium text-muted-foreground uppercase">Theme</h2>
        </div>
        
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex gap-3">
            {[
              { value: 'light', icon: Sun, label: 'Light' },
              { value: 'dark', icon: Moon, label: 'Dark' },
              { value: 'system', icon: Monitor, label: 'System' }
            ].map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => updateSetting('theme', value)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-colors",
                  settings?.theme === value
                    ? "border-[#0085ff] bg-[#0085ff]/5"
                    : "border-border hover:border-muted-foreground"
                )}
              >
                <Icon className={cn("h-6 w-6", settings?.theme === value ? "text-[#0085ff]" : "text-muted-foreground")} />
                <span className={cn("text-[14px] font-medium", settings?.theme === value ? "text-[#0085ff]" : "text-muted-foreground")}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Font Size */}
      <div className="border-t border-border">
        <div className="px-4 py-2 bg-muted">
          <h2 className="text-[13px] font-medium text-muted-foreground uppercase">Text Size</h2>
        </div>
        
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex gap-2">
            {['small', 'medium', 'large'].map((size) => (
              <button
                key={size}
                onClick={() => updateSetting('fontSize', size)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-[14px] font-medium transition-colors",
                  settings?.fontSize === size
                    ? "bg-[#0085ff] text-white"
                    : "bg-muted text-muted-foreground hover:opacity-80"
                )}
              >
                {size.charAt(0).toUpperCase() + size.slice(1)}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[12px] text-gray-400">
            Current size: {settings?.fontSize || 'medium'} - changes apply immediately
          </p>
        </div>
      </div>

      {/* Display */}
      <div className="border-t border-border">
        <div className="px-4 py-2 bg-muted">
          <h2 className="text-[13px] font-medium text-muted-foreground uppercase">Display</h2>
        </div>
        
        <SettingsToggleItem
          label="Compact Mode"
          description="Show more content on screen"
          enabled={settings?.compactMode || false}
          onChange={(v) => updateSetting('compactMode', v)}
        />
      </div>
    </div>
  );
}

// Accessibility Settings Page
export function AccessibilitySettingsPage({ onBack }: { onBack?: () => void }) {
  const { settings, isLoading, updateSetting } = useUserSettings();

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen">
        <SettingsHeader title="Accessibility" onBack={onBack} />
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 border-2 border-gray-300 border-t-[#0085ff] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <SettingsHeader title="Accessibility" onBack={onBack} />

      <div className="border-t border-border">
        <SettingsToggleItem
          label="Screen Reader Support"
          description="Optimize for screen readers"
          enabled={settings?.screenReader || false}
          onChange={(v) => updateSetting('screenReader', v)}
        />
        
        <SettingsToggleItem
          label="High Contrast"
          description="Increase contrast for better visibility"
          enabled={settings?.highContrast || false}
          onChange={(v) => updateSetting('highContrast', v)}
        />
        
        <SettingsToggleItem
          label="Reduce Animations"
          description="Minimize motion and animations"
          enabled={settings?.reduceAnimations || false}
          onChange={(v) => updateSetting('reduceAnimations', v)}
        />
      </div>

      <div className="px-4 py-4 text-center">
        <p className="text-[12px] text-gray-400">
          Accessibility settings apply immediately across the app
        </p>
      </div>
    </div>
  );
}

// Language Settings Page
export function LanguageSettingsPage({ onBack }: { onBack?: () => void }) {
  const { settings, isLoading, updateSetting } = useUserSettings();

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'zh', name: '中文' },
    { code: 'pt', name: 'Português' },
    { code: 'ar', name: 'العربية' },
    { code: 'hi', name: 'हिन्दी' },
  ];

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen">
        <SettingsHeader title="Languages" onBack={onBack} />
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 border-2 border-gray-300 border-t-[#0085ff] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const currentLang = languages.find(l => l.code === settings?.language);

  return (
    <div className="bg-background min-h-screen">
      <SettingsHeader title="Languages" onBack={onBack} />

      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <p className="text-[13px] text-gray-500">
          Current language: <span className="font-medium text-black">{currentLang?.name || 'English'}</span>
        </p>
      </div>

      <div className="divide-y divide-border">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => updateSetting('language', lang.code)}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors"
          >
            <span className="text-[15px] text-black">{lang.name}</span>
            {settings?.language === lang.code && (
              <Check className="h-5 w-5 text-[#0085ff]" />
            )}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 text-center">
        <p className="text-[12px] text-gray-400">
          Language preference is saved and will persist across sessions
        </p>
      </div>
    </div>
  );
}

// Help Page
export function HelpSettingsPage({ onBack }: { onBack?: () => void }) {
  const helpItems = [
    { 
      label: 'Getting Started', 
      description: 'Learn the basics of Bluesky',
      url: 'https://bsky.social/about/blog/10-2023-getting-started'
    },
    { 
      label: 'Safety Center', 
      description: 'Tips for staying safe',
      url: 'https://bsky.social/about/blog/community-guidelines'
    },
    { 
      label: 'Community Guidelines', 
      description: 'Our community standards',
      url: 'https://bsky.social/about/blog/community-guidelines'
    },
    { 
      label: 'Report a Problem', 
      description: 'Let us know about issues',
      url: 'https://bsky.app/support'
    },
    { 
      label: 'Contact Support', 
      description: 'Get help from our team',
      url: 'mailto:support@bsky.social'
    },
  ];

  const handleItemClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-background min-h-screen">
      <SettingsHeader title="Help" onBack={onBack} />

      <div className="divide-y divide-border">
        {helpItems.map((item, index) => (
          <button
            key={index}
            onClick={() => handleItemClick(item.url)}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors"
          >
            <div className="flex-1 text-left">
              <p className="text-[15px] text-black">{item.label}</p>
              <p className="text-[13px] text-gray-500 mt-0.5">{item.description}</p>
            </div>
            <ExternalLink className="h-5 w-5 text-gray-400 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

// About Page
export function AboutSettingsPage({ onBack }: { onBack?: () => void }) {
  const aboutItems = [
    { label: 'Terms of Service', url: 'https://bsky.social/about/support/tos' },
    { label: 'Privacy Policy', url: 'https://bsky.social/about/support/privacy' },
    { label: 'Community Guidelines', url: 'https://bsky.social/about/blog/community-guidelines' },
    { label: 'Open Source Licenses', url: 'https://github.com/bluesky-social' },
  ];

  const handleItemClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-background min-h-screen">
      <SettingsHeader title="About" onBack={onBack} />

      <div className="px-4 py-6 text-center border-b border-gray-200">
        <svg viewBox="0 0 24 24" className="h-16 w-16 mx-auto text-[#0085ff]" fill="currentColor">
          <circle cx="12" cy="12" r="10" fill="currentColor"/>
          <circle cx="8" cy="10" r="1.5" fill="white"/>
          <circle cx="16" cy="10" r="1.5" fill="white"/>
          <path d="M8 14c0 0 1.5 3 4 3s4-3 4-3" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
        </svg>
        <h2 className="mt-4 text-xl font-bold text-black">Bluesky</h2>
        <p className="mt-1 text-[14px] text-gray-500">Version 1.0.0</p>
      </div>

      <div className="divide-y divide-border">
        {aboutItems.map((item, index) => (
          <button
            key={index}
            onClick={() => handleItemClick(item.url)}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors"
          >
            <span className="text-[15px] text-black">{item.label}</span>
            <ExternalLink className="h-5 w-5 text-gray-400" />
          </button>
        ))}
      </div>

      <div className="px-4 py-6 text-center">
        <p className="text-[13px] text-gray-500">
          Made with ❤️ by the Bluesky community
        </p>
      </div>
    </div>
  );
}

// Moderation Settings Page
export function ModerationSettingsPage({ onBack }: { onBack?: () => void }) {
  const { token } = useAuthStore();
  const [showMutedWords, setShowMutedWords] = useState(false);
  const [mutedWords, setMutedWords] = useState<{ id: string; word: string }[]>([]);
  const [newWord, setNewWord] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const fetchMutedWords = async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/user/muted-words', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMutedWords(data.mutedWords);
      }
    } catch (error) {
      console.error('Failed to fetch muted words:', error);
    }
  };

  const addMutedWord = async () => {
    if (!token || !newWord.trim()) return;
    setIsAdding(true);
    try {
      const response = await fetch('/api/user/muted-words', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ word: newWord.trim() })
      });
      if (response.ok) {
        const data = await response.json();
        setMutedWords(prev => [data.mutedWord, ...prev]);
        setNewWord('');
      }
    } catch (error) {
      console.error('Failed to add muted word:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const removeMutedWord = async (wordId: string) => {
    if (!token) return;
    try {
      await fetch(`/api/user/muted-words?id=${wordId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMutedWords(prev => prev.filter(w => w.id !== wordId));
    } catch (error) {
      console.error('Failed to remove muted word:', error);
    }
  };

  // Muted Words View
  if (showMutedWords) {
    return (
      <div className="bg-background min-h-screen">
        <SettingsHeader 
          title="Muted Words" 
          onBack={() => setShowMutedWords(false)} 
        />
        
        {/* Add new word */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-2">
            <Input
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="Enter a word to mute..."
              className="h-10 text-[15px] border-gray-200 focus-visible:ring-[#0085ff]"
              onKeyDown={(e) => e.key === 'Enter' && addMutedWord()}
            />
            <Button
              onClick={addMutedWord}
              disabled={isAdding || !newWord.trim()}
              className="h-10 px-4 bg-[#0085ff] hover:bg-[#0070e0] text-white rounded-lg"
            >
              {isAdding ? '...' : 'Add'}
            </Button>
          </div>
          <p className="mt-2 text-[12px] text-gray-500">
            Posts containing these words will be hidden from your feed.
          </p>
        </div>
        
        {mutedWords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Tag className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-[15px] text-gray-500 text-center">No muted words yet.</p>
          </div>
        ) : (
          <div>
            {mutedWords.map((mw) => (
              <MutedWordItem
                key={mw.id}
                word={mw.word}
                onRemove={() => removeMutedWord(mw.id)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <SettingsHeader title="Moderation" onBack={onBack} />

      <div className="border-t border-border">
        <div className="px-4 py-2 bg-muted">
          <h2 className="text-[13px] font-medium text-muted-foreground uppercase">Content Controls</h2>
        </div>
        
        <SettingsNavItem
          label="Content Filters"
          description="Filter sensitive content"
          onClick={() => { window.history.pushState(null, '', '/settings-content'); window.dispatchEvent(new PopStateEvent('popstate')); }}
        />
        
        <SettingsNavItem
          label="Muted Words"
          description="Hide posts containing specific words"
          onClick={() => {
            fetchMutedWords();
            setShowMutedWords(true);
          }}
        />
      </div>

      <div className="border-t border-border">
        <div className="px-4 py-2 bg-muted">
          <h2 className="text-[13px] font-medium text-muted-foreground uppercase">Blocked & Muted</h2>
        </div>
        
        <SettingsNavItem
          label="Blocked Accounts"
          description="Manage blocked accounts"
          onClick={() => { window.history.pushState(null, '', '/settings-privacy'); window.dispatchEvent(new PopStateEvent('popstate')); }}
        />
        
        <SettingsNavItem
          label="Muted Accounts"
          description="Manage muted accounts"
          onClick={() => { window.history.pushState(null, '', '/settings-privacy'); window.dispatchEvent(new PopStateEvent('popstate')); }}
        />
      </div>
    </div>
  );
}

// Add Account Settings Page
export function AddAccountSettingsPage({ onBack }: { onBack?: () => void }) {
  const { logout } = useAuthStore();
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Store new session and reload to switch accounts
        window.location.href = '/';
      } else {
        setError(data.error || 'Failed to sign in');
      }
    } catch (err) {
      setError('Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  if (showLoginForm) {
    return (
      <div className="bg-background min-h-screen">
        <SettingsHeader title="Sign In" onBack={() => setShowLoginForm(false)} />
        
        <form onSubmit={handleLogin} className="p-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-[14px]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
          <label className="text-[13px] text-muted-foreground">Handle</label>
            <div className="relative mt-1">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="pl-9 h-10 text-[15px] border-gray-200 focus-visible:ring-[#0085ff]"
                placeholder="your.handle"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[13px] text-gray-500">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 h-10 text-[15px] border-gray-200 focus-visible:ring-[#0085ff]"
              placeholder="Enter password"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-[#0085ff] hover:bg-[#0070e0] text-white rounded-full text-[15px] font-medium"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <SettingsHeader title="Add Account" onBack={onBack} />

      <div className="p-6 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <UserPlus className="h-10 w-10 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-black mb-2">Add Another Account</h2>
        <p className="text-[15px] text-gray-500 mb-6">
          Sign in to another Bluesky account to switch between them easily.
        </p>
      </div>

      <div className="divide-y divide-border">
        <button
          onClick={() => setShowLoginForm(true)}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors"
        >
          <div className="flex-1 text-left">
            <p className="text-[15px] text-black">Sign in to existing account</p>
            <p className="text-[13px] text-gray-500 mt-0.5">Use your handle and password</p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 shrink-0" />
        </button>

        <button
          onClick={() => {
            logout();
            window.location.href = '/';
          }}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors"
        >
          <div className="flex-1 text-left">
            <p className="text-[15px] text-black">Create new account</p>
            <p className="text-[13px] text-gray-500 mt-0.5">Sign up for a new Bluesky account</p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 shrink-0" />
        </button>
      </div>

      <div className="p-4 mt-4">
        <p className="text-[12px] text-gray-400 text-center">
          You can switch between accounts by signing out and signing in with different credentials.
        </p>
      </div>
    </div>
  );
}

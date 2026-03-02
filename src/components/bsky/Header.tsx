'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, ArrowLeft, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store';
import { cn } from '@/lib/utils';

// Smiley Face Logo - blue smiley like 🙂
function SmileyLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <circle cx="12" cy="12" r="10" fill="currentColor"/>
      <circle cx="8" cy="10" r="1.5" fill="white"/>
      <circle cx="16" cy="10" r="1.5" fill="white"/>
      <path d="M8 14c0 0 1.5 3 4 3s4-3 4-3" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showMenu?: boolean;
  transparent?: boolean;
  onMenuClick?: () => void;
}

export function Header({
  title,
  showBack = false,
  showMenu = true,
  transparent = false,
  onMenuClick
}: HeaderProps) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const handleFeedsClick = () => {
    // Set hash and trigger navigation
    window.location.hash = 'feeds';
  };

  return (
    <header className={cn(
      'sticky top-0 z-40 flex items-center h-11 px-4',
      transparent ? 'bg-transparent' : 'bg-white border-b border-gray-200'
    )}>
      {/* Left Section - Menu (24px icon) */}
      <div className="flex items-center w-10">
        {showMenu && isAuthenticated && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 rounded-full hover:bg-gray-100 p-0"
            onClick={onMenuClick}
          >
            <Menu className="size-6 text-black" />
          </Button>
        )}

        {showBack && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 rounded-full hover:bg-gray-100 p-0"
            asChild
          >
            <Link href="#">
              <ArrowLeft className="size-6 text-black" />
            </Link>
          </Button>
        )}
      </div>

      {/* Center Section - Logo (32px - larger) or Title */}
      <div className="flex-1 flex justify-center items-center">
        {title ? (
          <h1 className="text-[17px] font-semibold text-black truncate">{title}</h1>
        ) : (
          <Link href="#home">
            <SmileyLogo className="size-8 text-[#0085ff]" />
          </Link>
        )}
      </div>

      {/* Right Section - Hash Icon (24px icon) */}
      <div className="flex items-center justify-end w-10">
        {isAuthenticated && !title && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 rounded-full hover:bg-gray-100 p-0"
            onClick={handleFeedsClick}
          >
            <Hash className="size-6 text-black" />
          </Button>
        )}
      </div>
    </header>
  );
}

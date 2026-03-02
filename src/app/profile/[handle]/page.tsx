'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ProfilePage } from '@/components/bsky';

export default function ProfileHandlePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = use(params);
  const router = useRouter();
  return <ProfilePage handle={handle} onBack={() => router.back()} />;
}

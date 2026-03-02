'use client';

import React from 'react';
import { ThemeProvider } from 'next-themes';
import { UserSettingsProvider } from './UserSettingsProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      <UserSettingsProvider>
        {children}
      </UserSettingsProvider>
    </ThemeProvider>
  );
}

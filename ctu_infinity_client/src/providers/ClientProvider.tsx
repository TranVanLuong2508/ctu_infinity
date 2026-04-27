'use client';

import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/sonner';
import React from 'react';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
      <Sonner />
    </>
  );
}

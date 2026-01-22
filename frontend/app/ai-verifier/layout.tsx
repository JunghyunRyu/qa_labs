'use client';

import { ReactNode } from 'react';

interface AIVerifierLayoutProps {
  children: ReactNode;
}

export default function AIVerifierLayout({ children }: AIVerifierLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-900">
      {children}
    </div>
  );
}

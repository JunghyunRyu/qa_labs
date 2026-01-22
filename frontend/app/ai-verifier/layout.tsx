import { ReactNode } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Verifier Track | QA Arena',
  description: 'AI가 만든 코드의 버그를 찾아보세요. 코딩 없이 논리적 사고만으로 도전할 수 있습니다.',
  openGraph: {
    title: 'AI Verifier Track | QA Arena',
    description: 'AI 코드의 버그를 찾는 새로운 도전! 코딩 없이 논리적 사고로 버그를 발견하세요.',
    type: 'website',
    siteName: 'QA Arena',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Verifier Track | QA Arena',
    description: 'AI 코드의 버그를 찾는 새로운 도전!',
  },
};

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

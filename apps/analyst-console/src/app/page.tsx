'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function IndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="h-[80vh] flex flex-col items-center justify-center font-mono text-xs text-muted-foreground space-y-3">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <span>CYBERMIND OS — Redirecting to SOC Command Center...</span>
    </div>
  );
}

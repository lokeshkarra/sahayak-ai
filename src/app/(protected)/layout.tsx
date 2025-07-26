"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
      if (!loggedIn) {
        router.replace('/login');
      } else {
        setIsAuth(true);
      }
    }
  }, [router]);

  if (!isAuth) {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="space-y-4 w-1/2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        </div>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}

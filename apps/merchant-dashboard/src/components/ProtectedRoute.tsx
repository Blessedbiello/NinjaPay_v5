'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';

function readAuthToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedToken = localStorage.getItem('auth_token');
  if (storedToken) {
    return storedToken;
  }

  const cookieMatch = document.cookie.match(/(?:^|;\s*)auth_token=([^;]*)/);
  return cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
}

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = readAuthToken();

    if (!token) {
      router.replace('/');
      return;
    }

    setIsAuthorized(true);
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          <span className="text-sm text-muted-foreground">Checking access...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

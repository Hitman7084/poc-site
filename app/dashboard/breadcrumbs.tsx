'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { navigation } from './navigation';

export function Breadcrumbs() {
  const pathname = usePathname();

  // Don't show breadcrumbs on dashboard home
  if (pathname === '/dashboard') return null;

  const currentPage = navigation.find(item => item.href === pathname);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
      <Link
        href="/dashboard"
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
        <span className="sr-only">Dashboard</span>
      </Link>
      {currentPage && (
        <>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{currentPage.name}</span>
        </>
      )}
    </nav>
  );
}

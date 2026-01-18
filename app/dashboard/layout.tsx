'use client'

import { ReactNode } from 'react'
import { DashboardSidebar } from './sidebar'
import { DashboardHeader } from './header'
import { cn } from '@/lib/utils'
import { useSidebarCollapsed } from '@/hooks/useHydration'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [isCollapsed] = useSidebarCollapsed()

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      
      <div className={cn(
        "sidebar-transition",
        isCollapsed ? "lg:pl-16" : "lg:pl-64"
      )}>
        <DashboardHeader />
        
        <main className="p-4 sm:p-6 lg:p-8 construction-pattern min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  )
}

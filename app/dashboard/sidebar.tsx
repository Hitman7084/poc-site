'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navigation } from './navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Flame, Menu, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { useSidebarCollapsed } from '@/hooks/useHydration'
import { ClientOnly } from '@/components/ClientOnly'

interface SidebarContentProps {
  pathname: string
  onLinkClick?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  showCollapseButton?: boolean
}

function SidebarContent({ 
  pathname, 
  onLinkClick, 
  isCollapsed = false, 
  onToggleCollapse,
  showCollapseButton = false 
}: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Logo */}
      <div className={cn(
        "flex h-16 items-center border-b border-sidebar-border",
        isCollapsed ? "px-3 justify-center" : "px-4"
      )}>
        <Link href="/dashboard" className={cn(
          "flex items-center",
          isCollapsed ? "justify-center" : "gap-3"
        )}>
          <div className="p-1.5 bg-sidebar-primary rounded-lg shrink-0">
            <Flame className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="sidebar-content-transition">
              <span className="text-base font-bold text-sidebar-foreground leading-tight">Singh Fire</span>
              <p className="text-[10px] text-sidebar-foreground/60 -mt-0.5">Engineers</p>
            </div>
          )}
        </Link>
        {showCollapseButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className={cn(
              "h-7 w-7 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent ml-auto shrink-0",
              isCollapsed && "ml-0 mt-2"
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className={cn("flex-1 py-4", isCollapsed ? "px-2" : "px-3")}>
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onLinkClick}
                title={isCollapsed ? item.name : undefined}
                className={cn(
                  'flex items-center rounded-lg text-sm font-medium transition-all duration-200',
                  isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isActive && "drop-shadow-sm")} />
                {!isCollapsed && (
                  <span className="sidebar-content-transition">{item.name}</span>
                )}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className={cn(
        "border-t border-sidebar-border",
        isCollapsed ? "p-2" : "p-4"
      )}>
        <div className="text-center">
          {!isCollapsed ? (
            <>
              <p className="text-[10px] text-sidebar-foreground/50">
                © 2026 Singh Fire Engineers
              </p>
              <p className="text-[10px] text-sidebar-foreground/40 mt-1">
                Crafted by <span className="text-sidebar-primary/80">Himanshu Mall & Piyush Kumar</span>
              </p>
            </>
          ) : (
            <p className="text-[10px] text-sidebar-foreground/40">SFE</p>
          )}
        </div>
      </div>
    </div>
  )
}

export function DashboardSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [isCollapsed, toggleCollapse] = useSidebarCollapsed()

  return (
    <>
      {/* Mobile Sidebar */}
      <ClientOnly>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon" className="fixed left-4 top-4 z-40 bg-background/80 backdrop-blur-sm shadow-sm">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SidebarContent pathname={pathname} onLinkClick={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </ClientOnly>

      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:flex-col sidebar-transition",
          isCollapsed ? "lg:w-16" : "lg:w-64"
        )}
      >
        <SidebarContent 
          pathname={pathname} 
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
          showCollapseButton={true}
        />
      </aside>
    </>
  )
}

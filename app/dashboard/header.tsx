'use client'

import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Moon, Sun, LogOut, User } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Breadcrumbs } from './breadcrumbs'
import { useState } from 'react'
import { ClientOnly } from '@/components/ClientOnly'
import { useHydrated } from '@/hooks/useHydration'

export function DashboardHeader() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [isAnimating, setIsAnimating] = useState(false)
  const isHydrated = useHydrated()

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleThemeToggle = () => {
    setIsAnimating(true)
    setTheme(theme === 'dark' ? 'light' : 'dark')
    setTimeout(() => setIsAnimating(false), 500)
  }

  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left side - Breadcrumbs */}
        <div className="flex-1 hidden md:block">
          <Breadcrumbs />
        </div>
        <div className="flex-1 md:hidden" />

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Animated Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleThemeToggle}
            className="h-9 w-9 rounded-lg relative overflow-hidden group hover:bg-accent"
            aria-label="Toggle theme"
          >
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
              isAnimating ? 'animate-theme-toggle' : ''
            }`}>
              {isHydrated ? (
                <>
                  <Sun className={`h-4 w-4 absolute transition-all duration-500 ease-in-out ${
                    theme === 'dark' 
                      ? 'rotate-90 scale-0 opacity-0' 
                      : 'rotate-0 scale-100 opacity-100'
                  }`} />
                  <Moon className={`h-4 w-4 absolute transition-all duration-500 ease-in-out ${
                    theme === 'dark' 
                      ? 'rotate-0 scale-100 opacity-100' 
                      : '-rotate-90 scale-0 opacity-0'
                  }`} />
                </>
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </div>
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* User Menu */}
          <ClientOnly fallback={
            <Button variant="ghost" className="h-9 gap-2 px-2 rounded-lg">
              <Avatar className="h-7 w-7 bg-primary/10">
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                  U
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline-block text-sm font-medium">
                User
              </span>
            </Button>
          }>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 gap-2 px-2 rounded-lg">
                  <Avatar className="h-7 w-7 bg-primary/10">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                      {session?.user?.name ? getInitials(session.user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline-block text-sm font-medium">
                    {session?.user?.name || 'User'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session?.user?.name || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session?.user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ClientOnly>
        </div>
      </div>
    </header>
  )
}

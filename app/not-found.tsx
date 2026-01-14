'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, ArrowLeft, Search, FileQuestion } from 'lucide-react'

export default function NotFound() {
  const { data: session, status } = useSession()
  const isAuthenticated = status === 'authenticated'

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-muted p-4">
              <FileQuestion className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">404 - Page Not Found</CardTitle>
          <CardDescription className="text-base">
            The page you're looking for doesn't exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            {isAuthenticated ? (
              <>
                <p className="text-sm text-muted-foreground text-center">
                  Here are some helpful links to get you back on track:
                </p>
                <div className="grid gap-3">
                  <Link href="/dashboard" className="w-full">
                    <Button variant="default" className="w-full">
                      <Home className="mr-2 h-4 w-4" />
                      Go to Dashboard
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground text-center">
                  Please log in to access the system.
                </p>
                <div className="grid gap-3">
                  <Link href="/login" className="w-full">
                    <Button variant="default" className="w-full">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>

          {isAuthenticated && (
            <Card className="border-muted bg-muted/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Quick Links
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/dashboard/workers" className="text-muted-foreground hover:text-primary transition-colors">
                      → Workers Management
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard/sites" className="text-muted-foreground hover:text-primary transition-colors">
                      → Sites Management
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard/attendance" className="text-muted-foreground hover:text-primary transition-colors">
                      → Attendance Tracking
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard/materials" className="text-muted-foreground hover:text-primary transition-colors">
                      → Materials Inventory
                    </Link>
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, ArrowLeft, FileQuestion, Flame } from 'lucide-react'

export default function NotFound() {
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
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Please check the URL or navigate to a valid page.
            </p>
            <div className="grid gap-3">
              <Link href="/login" className="w-full">
                <Button variant="default" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go to Login
                </Button>
              </Link>
              <Link href="/dashboard" className="w-full">
                <Button variant="outline" className="w-full">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </div>

          <div className="text-center pt-4 border-t">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Flame className="h-4 w-4" />
              <span className="text-sm">Singh Fire Engineers</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

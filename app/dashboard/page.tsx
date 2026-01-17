import { Users, MapPin, CalendarCheck, HardHat, Wrench, Package, Truck, Clock, DollarSign } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-xl">
          <HardHat className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to BuildTrack Construction Management</p>
        </div>
      </div>

      {/* Getting Started */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardHeader className="relative">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Wrench className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Follow these steps to set up your construction management system
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <ol className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground shadow-sm">1</span>
              <span className="pt-0.5">Add your workforce to the system via the <strong className="text-primary">Workers</strong> module</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground shadow-sm">2</span>
              <span className="pt-0.5">Create construction sites in the <strong className="text-primary">Sites & Attendance</strong> module</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground shadow-sm">3</span>
              <span className="pt-0.5">Start recording daily attendance and work progress updates</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground shadow-sm">4</span>
              <span className="pt-0.5">Track materials, dispatch, payments, and expenses as they occur</span>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/dashboard/workers">
            <Card className="group border-2 border-dashed hover:border-primary hover:shadow-md transition-all duration-200 cursor-pointer h-full bg-gradient-to-br from-background to-muted/30">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto p-3 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors mb-2">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-base group-hover:text-primary transition-colors">Add Worker</CardTitle>
                <CardDescription className="text-xs">Register a new team member</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          
          <Link href="/dashboard/sites">
            <Card className="group border-2 border-dashed hover:border-primary hover:shadow-md transition-all duration-200 cursor-pointer h-full bg-gradient-to-br from-background to-muted/30">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto p-3 rounded-xl bg-green-500/10 group-hover:bg-green-500/20 transition-colors mb-2">
                  <MapPin className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-base group-hover:text-primary transition-colors">Add Site</CardTitle>
                <CardDescription className="text-xs">Create a new project site</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          
          <Link href="/dashboard/sites">
            <Card className="group border-2 border-dashed hover:border-primary hover:shadow-md transition-all duration-200 cursor-pointer h-full bg-gradient-to-br from-background to-muted/30">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors mb-2">
                  <CalendarCheck className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-base group-hover:text-primary transition-colors">Mark Attendance</CardTitle>
                <CardDescription className="text-xs">Record today's site attendance</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>

      {/* Module Overview */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-semibold">System Modules</h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/dashboard/materials">
            <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                  <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-sm group-hover:text-primary transition-colors">Materials</p>
                  <p className="text-xs text-muted-foreground">Inventory management</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/dashboard/dispatch">
            <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                  <Truck className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="font-medium text-sm group-hover:text-primary transition-colors">Dispatch</p>
                  <p className="text-xs text-muted-foreground">Material deliveries</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/dashboard/overtime">
            <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
                  <Clock className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <p className="font-medium text-sm group-hover:text-primary transition-colors">Overtime</p>
                  <p className="text-xs text-muted-foreground">Extra hours tracking</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/dashboard/payments">
            <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                  <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium text-sm group-hover:text-primary transition-colors">Payments</p>
                  <p className="text-xs text-muted-foreground">Worker payments</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}

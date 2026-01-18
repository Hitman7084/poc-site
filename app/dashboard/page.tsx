import { Users, MapPin, CalendarCheck, HardHat, Wrench, Package, Truck, Clock, DollarSign } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 rounded-lg">
          <HardHat className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome to Record Management System</p>
        </div>
      </div>

      {/* Getting Started */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardHeader className="relative pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-md">
              <Wrench className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Getting Started</CardTitle>
              <CardDescription className="text-xs">
                Set up your record management system
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative pt-0">
          <ol className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">1</span>
              <span className="pt-0.5 text-xs">Add workforce via <strong className="text-primary">Workers</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">2</span>
              <span className="pt-0.5 text-xs">Create sites in <strong className="text-primary">Sites & Attendance</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">3</span>
              <span className="pt-0.5 text-xs">Record daily attendance and work updates</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">4</span>
              <span className="pt-0.5 text-xs">Track materials, dispatch, payments & expenses</span>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-sm font-medium">Quick Actions</h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/dashboard/workers">
            <Card className="group border-2 border-dashed hover:border-primary hover:shadow-sm transition-all duration-200 cursor-pointer h-full bg-gradient-to-br from-background to-muted/30">
              <CardHeader className="text-center p-4">
                <div className="mx-auto p-2.5 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors mb-1.5">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-sm group-hover:text-primary transition-colors">Add Worker</CardTitle>
                <CardDescription className="text-xs">Register a new team member</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          
          <Link href="/dashboard/sites">
            <Card className="group border-2 border-dashed hover:border-primary hover:shadow-sm transition-all duration-200 cursor-pointer h-full bg-gradient-to-br from-background to-muted/30">
              <CardHeader className="text-center p-4">
                <div className="mx-auto p-2.5 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors mb-1.5">
                  <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-sm group-hover:text-primary transition-colors">Add Site</CardTitle>
                <CardDescription className="text-xs">Create a new project site</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          
          <Link href="/dashboard/sites">
            <Card className="group border-2 border-dashed hover:border-primary hover:shadow-sm transition-all duration-200 cursor-pointer h-full bg-gradient-to-br from-background to-muted/30">
              <CardHeader className="text-center p-4">
                <div className="mx-auto p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors mb-1.5">
                  <CalendarCheck className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-sm group-hover:text-primary transition-colors">Mark Attendance</CardTitle>
                <CardDescription className="text-xs">Record today&apos;s site attendance</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>

      {/* Module Overview */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-sm font-medium">System Modules</h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/dashboard/materials">
            <Card className="group hover:shadow-sm transition-all duration-200 cursor-pointer">
              <CardContent className="p-3 flex items-center gap-2.5">
                <div className="p-1.5 rounded-md bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                  <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-sm group-hover:text-primary transition-colors">Materials</p>
                  <p className="text-[10px] text-muted-foreground">Inventory</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/dashboard/dispatch">
            <Card className="group hover:shadow-sm transition-all duration-200 cursor-pointer">
              <CardContent className="p-3 flex items-center gap-2.5">
                <div className="p-1.5 rounded-md bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                  <Truck className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="font-medium text-sm group-hover:text-primary transition-colors">Dispatch</p>
                  <p className="text-[10px] text-muted-foreground">Deliveries</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/dashboard/overtime">
            <Card className="group hover:shadow-sm transition-all duration-200 cursor-pointer">
              <CardContent className="p-3 flex items-center gap-2.5">
                <div className="p-1.5 rounded-md bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
                  <Clock className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <p className="font-medium text-sm group-hover:text-primary transition-colors">Overtime</p>
                  <p className="text-[10px] text-muted-foreground">Extra hours</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/dashboard/payments">
            <Card className="group hover:shadow-sm transition-all duration-200 cursor-pointer">
              <CardContent className="p-3 flex items-center gap-2.5">
                <div className="p-1.5 rounded-md bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                  <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium text-sm group-hover:text-primary transition-colors">Payments</p>
                  <p className="text-[10px] text-muted-foreground">Transactions</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}

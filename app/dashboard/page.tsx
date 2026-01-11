import { Users, MapPin, CalendarCheck, Package, Truck, DollarSign, TrendingUp, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  const stats = [
    {
      name: 'Active Workers',
      value: '0',
      icon: Users,
      description: 'Currently employed',
      trend: '+0 this month',
    },
    {
      name: 'Active Sites',
      value: '0',
      icon: MapPin,
      description: 'Ongoing projects',
      trend: '+0 this month',
    },
    {
      name: 'Today\'s Attendance',
      value: '0',
      icon: CalendarCheck,
      description: 'Workers present',
      trend: '0% attendance rate',
    },
    {
      name: 'Pending Payments',
      value: '₹0',
      icon: DollarSign,
      description: 'Outstanding amount',
      trend: '0 invoices',
    },
    {
      name: 'Material Stock',
      value: '0',
      icon: Package,
      description: 'Items in inventory',
      trend: '0 sites',
    },
    {
      name: 'Pending Dispatches',
      value: '0',
      icon: Truck,
      description: 'Not yet received',
      trend: '0 in transit',
    },
    {
      name: 'This Month Expenses',
      value: '₹0',
      icon: TrendingUp,
      description: 'Total spent',
      trend: '+0% from last month',
    },
    {
      name: 'Pending Work',
      value: '0',
      icon: AlertCircle,
      description: 'Tasks incomplete',
      trend: '0 overdue',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your construction management system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-2 border-dashed hover:border-primary transition-colors cursor-pointer">
              <CardHeader className="text-center">
                <Users className="h-8 w-8 mx-auto text-muted-foreground" />
                <CardTitle className="text-base">Add Worker</CardTitle>
                <CardDescription className="text-xs">Register a new worker</CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-2 border-dashed hover:border-primary transition-colors cursor-pointer">
              <CardHeader className="text-center">
                <MapPin className="h-8 w-8 mx-auto text-muted-foreground" />
                <CardTitle className="text-base">Add Site</CardTitle>
                <CardDescription className="text-xs">Create a new project site</CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-2 border-dashed hover:border-primary transition-colors cursor-pointer">
              <CardHeader className="text-center">
                <CalendarCheck className="h-8 w-8 mx-auto text-muted-foreground" />
                <CardTitle className="text-base">Mark Attendance</CardTitle>
                <CardDescription className="text-xs">Record today's attendance</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
        <CardHeader>
          <CardTitle>🎉 Getting Started</CardTitle>
          <CardDescription className="dark:text-blue-200">
            Follow these steps to set up your system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs text-white">1</span>
              <span>Add workers to the system via the <strong>Workers</strong> module</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs text-white">2</span>
              <span>Create project sites in the <strong>Sites</strong> module</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs text-white">3</span>
              <span>Start recording daily attendance and work updates</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs text-white">4</span>
              <span>Track materials, payments, and expenses as they occur</span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}

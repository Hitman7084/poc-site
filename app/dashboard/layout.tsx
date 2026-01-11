import { ReactNode } from 'react'
import { DashboardSidebar } from './sidebar'
import { DashboardHeader } from './header'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <DashboardSidebar />
      
      <div className="lg:pl-64">
        <DashboardHeader />
        
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

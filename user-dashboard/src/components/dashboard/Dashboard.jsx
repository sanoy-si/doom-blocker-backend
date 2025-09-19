import React from 'react'
import { Sidebar } from './Sidebar'
import { TopNavigation } from './TopNavigation'
import { AnalyticsDashboard } from '../analytics/AnalyticsDashboard'

export function Dashboard() {
  return (
    <div className="h-screen bg-background text-foreground dark">
      <TopNavigation />
      <div className="flex h-[calc(100vh-140px)]">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <AnalyticsDashboard />
        </div>
      </div>
    </div>
  )
}
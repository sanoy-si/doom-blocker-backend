import React from 'react'
import { MetricCard } from './MetricCard'
import { AnalyticsChart } from './AnalyticsChart'
import { DataTable } from './DataTable'

export function AnalyticsDashboard() {
  return (
    <div className="p-8 space-y-8 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Browser Filter Analytics</h1>
          <p className="text-muted-foreground">Monitor your content filtering performance</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Blocked"
          value="12,450"
          change="+12.5%"
          changeType="positive"
          description="Content blocked this month"
        />
        <MetricCard
          title="Active Users"
          value="1,234"
          change="-20%"
          changeType="negative"
          description="Extension installations"
        />
        <MetricCard
          title="Time Saved"
          value="18h 25m"
          change="+12.5%"
          changeType="positive"
          description="Productive browsing time"
        />
        <MetricCard
          title="Filter Accuracy"
          value="94.5%"
          description="Blocking effectiveness"
        />
      </div>

      {/* Chart Section */}
      <AnalyticsChart />

      {/* Data Table */}
      <DataTable />
    </div>
  )
}
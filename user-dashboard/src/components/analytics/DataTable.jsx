import React from 'react'
import { cn } from '@/lib/utils'
import { MoreHorizontal, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'

const tableData = [
  {
    id: 1,
    keyword: 'spoiler',
    platform: 'YouTube',
    blocked: 234,
    accuracy: 96,
    status: 'Active'
  },
  {
    id: 2,
    keyword: 'clickbait',
    platform: 'All Platforms',
    blocked: 189,
    accuracy: 94,
    status: 'Active'
  },
  {
    id: 3,
    keyword: 'prank',
    platform: 'YouTube',
    blocked: 156,
    accuracy: 98,
    status: 'Active'
  },
  {
    id: 4,
    keyword: 'politics',
    platform: 'Twitter',
    blocked: 298,
    accuracy: 92,
    status: 'Active'
  }
]

const tabs = [
  { name: 'Keywords', active: true },
  { name: 'Blocked Sites', count: 15 },
  { name: 'User Sessions', count: 247 },
  { name: 'Performance' }
]

export function DataTable() {
  return (
    <div className="bg-card border border-border rounded-lg">
      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex items-center gap-4 px-6 py-4">
          {tabs.map((tab, index) => (
            <button
              key={index}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                tab.active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {tab.name}
              {tab.count && (
                <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
          <div className="ml-auto">
            <Button variant="outline" size="sm" className="gap-2">
              <MoreHorizontal className="h-4 w-4" />
              Customize Columns
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">
                Keyword
              </th>
              <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">
                Platform
              </th>
              <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">
                Blocked
              </th>
              <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">
                Accuracy
              </th>
              <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row) => (
              <tr key={row.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                    <input
                      type="checkbox"
                      className="rounded border-border"
                    />
                    <span className="text-sm font-medium text-foreground">
                      {row.keyword}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium",
                    row.platform === 'YouTube'
                      ? "bg-red-500/20 text-red-300 border border-red-500/30"
                      : row.platform === 'Twitter'
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      : "bg-gray-500/20 text-gray-300 border border-gray-500/30"
                  )}>
                    {row.platform}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-foreground font-medium">
                    {row.blocked}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-foreground font-medium">
                    {row.accuracy}%
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-green-400">
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
import React from 'react'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

export function MetricCard({ title, value, change, changeType, description, className }) {
  const isPositive = changeType === 'positive'
  const isNegative = changeType === 'negative'

  return (
    <div className={cn(
      "bg-card border border-border rounded-lg p-6 space-y-3",
      className
    )}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {change && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium",
            isPositive && "text-green-400",
            isNegative && "text-red-400"
          )}>
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {change}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  )
}
import React from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

const data = [
  { date: 'Jun 1', youtube: 120, linkedin: 89, reddit: 45, twitter: 67 },
  { date: 'Jun 3', youtube: 98, linkedin: 76, reddit: 38, twitter: 52 },
  { date: 'Jun 5', youtube: 145, linkedin: 112, reddit: 67, twitter: 89 },
  { date: 'Jun 7', youtube: 132, linkedin: 98, reddit: 56, twitter: 78 },
  { date: 'Jun 9', youtube: 108, linkedin: 82, reddit: 42, twitter: 61 },
  { date: 'Jun 12', youtube: 156, linkedin: 125, reddit: 78, twitter: 95 },
  { date: 'Jun 15', youtube: 142, linkedin: 108, reddit: 65, twitter: 84 },
  { date: 'Jun 18', youtube: 167, linkedin: 134, reddit: 89, twitter: 102 },
  { date: 'Jun 21', youtube: 155, linkedin: 119, reddit: 72, twitter: 91 },
  { date: 'Jun 24', youtube: 148, linkedin: 115, reddit: 68, twitter: 87 },
  { date: 'Jun 27', youtube: 172, linkedin: 142, reddit: 95, twitter: 108 },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-md">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground capitalize">{entry.dataKey}:</span>
            <span className="text-foreground font-medium">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function AnalyticsChart() {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Blocked Content</h3>
          <p className="text-sm text-muted-foreground">Platform blocking statistics for the last 3 months</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1 text-xs rounded-md bg-accent text-accent-foreground">
            Last 3 months
          </button>
          <button className="px-3 py-1 text-xs rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground">
            Last 30 days
          </button>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="youtubeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff0000" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ff0000" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="linkedinGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0077b5" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#0077b5" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="redditGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff4500" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#ff4500" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="twitterGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1da1f2" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#1da1f2" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="youtube"
              stackId="1"
              stroke="#ff0000"
              fill="url(#youtubeGradient)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="linkedin"
              stackId="1"
              stroke="#0077b5"
              fill="url(#linkedinGradient)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="reddit"
              stackId="1"
              stroke="#ff4500"
              fill="url(#redditGradient)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="twitter"
              stackId="1"
              stroke="#1da1f2"
              fill="url(#twitterGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-sm text-muted-foreground">YouTube</span>
          <span className="text-sm text-foreground font-medium">172</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
          <span className="text-sm text-muted-foreground">LinkedIn</span>
          <span className="text-sm text-foreground font-medium">142</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span className="text-sm text-muted-foreground">Reddit</span>
          <span className="text-sm text-foreground font-medium">95</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-400"></div>
          <span className="text-sm text-muted-foreground">Twitter</span>
          <span className="text-sm text-foreground font-medium">108</span>
        </div>
      </div>
    </div>
  )
}
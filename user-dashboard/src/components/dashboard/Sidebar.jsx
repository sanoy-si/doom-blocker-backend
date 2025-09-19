import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Inbox,
  FileText,
  Send,
  Trash2,
  Archive,
  Users,
  RefreshCw,
  MessageSquare,
  ShoppingCart,
  Zap,
  MoreHorizontal
} from 'lucide-react'
import { cn } from '@/lib/utils'

const sidebarItems = [
  { icon: FileText, label: 'Dashboard', count: null, active: true },
  { icon: Send, label: 'Analytics', count: null },
  { icon: Inbox, label: 'Filter Rules', count: 128 },
  { icon: Trash2, label: 'Blocked Keywords', count: 23 },
  { icon: Archive, label: 'Data Library', count: null },
  { icon: MessageSquare, label: 'Reports', count: 128 },
  { icon: Users, label: 'Team', count: null },
  { icon: RefreshCw, label: 'Settings', count: null },
  { icon: ShoppingCart, label: 'Get Help', count: null },
  { icon: Zap, label: 'More', count: null },
]

export function Sidebar() {
  return (
    <div className="w-72 bg-card border-r border-border flex flex-col h-screen">
      {/* User Profile Section */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Acme Inc.</p>
          </div>
        </div>
      </div>

      {/* Quick Create Button */}
      <div className="p-4">
        <button className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors">
          <span>+</span>
          Quick Create
        </button>
      </div>

      {/* Navigation Items */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          {sidebarItems.slice(0, 3).map((item, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors mb-1",
                item.active
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {item.count && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-md",
                  item.active ? "text-muted-foreground" : "text-muted-foreground"
                )}>
                  {item.count}
                </span>
              )}
            </div>
          ))}

          {/* Documents Section */}
          <div className="mt-6 mb-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3">
              Documents
            </h4>
          </div>
          {sidebarItems.slice(3).map((item, index) => (
            <div
              key={index + 3}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors mb-1",
                item.active
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {item.count && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-md",
                  item.active ? "text-muted-foreground" : "text-muted-foreground"
                )}>
                  {item.count}
                </span>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Bottom Profile Section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-purple-600 text-white text-xs font-medium">
              CN
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">shadcn</p>
            <p className="text-xs text-muted-foreground truncate">m@example.com</p>
          </div>
          <button className="text-muted-foreground hover:text-foreground">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
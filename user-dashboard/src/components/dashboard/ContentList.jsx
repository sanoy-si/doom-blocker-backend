import React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

const contentItems = [
  {
    id: 1,
    sender: 'William Smith',
    subject: 'Meeting Tomorrow',
    preview: 'Hi, let\'s have a meeting tomorrow to discuss the project. I\'ve been reviewing the project details and have some...',
    time: 'almost 2 years ago',
    tags: ['meeting', 'work', 'important'],
    active: true,
    avatar: 'WS'
  },
  {
    id: 2,
    sender: 'Alice Smith',
    subject: 'Re: Project Update',
    preview: 'Thank you for the project update. It looks great! I\'ve gone through the report, and the progress is impressive. The...',
    time: 'almost 2 years ago',
    tags: ['work', 'important'],
    avatar: 'AS'
  },
  {
    id: 3,
    sender: 'Bob Johnson',
    subject: 'Weekend Plans',
    preview: 'Any plans for the weekend? I was thinking we could...',
    time: 'over 2 years ago',
    tags: [],
    avatar: 'BJ'
  },
]

export function ContentList() {
  return (
    <div className="w-96 border-r border-border bg-card flex flex-col h-screen">
      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search"
            className="pl-10 bg-background border-input"
          />
        </div>
      </div>

      {/* Content Items */}
      <div className="flex-1 overflow-hidden">
        {contentItems.map((item) => (
          <div
            key={item.id}
            className={cn(
              "p-4 border-b border-border cursor-pointer transition-colors",
              item.active
                ? "bg-blue-600/10 border-l-4 border-l-blue-600"
                : "hover:bg-accent/30 border-l-4 border-l-transparent"
            )}
          >
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8 mt-1">
                <AvatarFallback className="bg-blue-600 text-white text-xs font-medium">
                  {item.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-foreground truncate">
                    {item.sender}
                  </h4>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {item.time}
                  </span>
                </div>
                <h5 className="text-sm font-medium text-foreground mb-1 truncate">
                  {item.subject}
                </h5>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {item.preview}
                </p>
                {item.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {item.tags.map((tag, index) => (
                      <span
                        key={index}
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
                          tag === 'important'
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        )}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
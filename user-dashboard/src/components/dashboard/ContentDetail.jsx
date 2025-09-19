import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function ContentDetail() {
  return (
    <div className="flex-1 bg-background p-8">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-blue-600 text-white font-medium">
              WS
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h2 className="text-lg font-semibold text-foreground">William Smith</h2>
                <h3 className="text-xl font-semibold text-foreground mb-1">Meeting Tomorrow</h3>
                <p className="text-sm text-muted-foreground">
                  Reply-To: williamsmith@example.com
                </p>
              </div>
              <span className="text-sm text-muted-foreground whitespace-nowrap">Oct 22, 2023, 9:00:00 AM</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <p className="text-foreground leading-relaxed mb-6 text-base">
            Hi, let's have a meeting tomorrow to discuss the project. I've been reviewing the
            project details and have some ideas I'd like to share. It's crucial that we align on
            our next steps to ensure the project's success.
          </p>

          <p className="text-foreground leading-relaxed mb-6 text-base">
            Please come prepared with any questions or insights you may have. Looking
            forward to our meeting!
          </p>

          <p className="text-foreground leading-relaxed text-base">
            Best regards, William
          </p>
        </div>
      </div>
    </div>
  )
}
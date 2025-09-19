import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Search,
  Archive,
  Trash2,
  Clock,
  ArrowLeft,
  ArrowRight,
  MoreHorizontal,
  Github,
  Moon
} from 'lucide-react'

export function TopNavigation() {
  return (
    <div className="border-b border-border bg-background">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <span className="font-semibold text-lg">Acme Inc.</span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Cards</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground bg-accent px-3 py-1 rounded">Dashboard</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Mail</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Pricing</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Color Palette</a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Github className="h-4 w-4" />
            <span className="text-sm text-muted-foreground">7.2k</span>
          </div>
          <Button variant="ghost" size="icon">
            <Moon className="h-4 w-4" />
          </Button>
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
            Try It Now →
          </Button>
        </div>
      </div>

    </div>
  )
}

function Zap({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}
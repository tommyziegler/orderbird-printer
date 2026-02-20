import * as React from 'react'
import { cn } from '@/lib/utils'

interface TooltipProps {
  content: string
  children: React.ReactNode
  className?: string
}

export function Tooltip({ content, children, className }: TooltipProps) {
  return (
    <div className={cn('group relative inline-flex', className)}>
      {children}
      <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[hsl(var(--foreground))] px-2.5 py-1 text-xs text-[hsl(var(--background))] opacity-0 transition-opacity group-hover:opacity-100 z-50">
        {content}
        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[hsl(var(--foreground))]" />
      </div>
    </div>
  )
}

import type { ReactNode } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export interface PageCardProps {
  title: string
  description: string
  children: ReactNode
  /**
   * Primary action rendered in the header, to the right of the title (below
   * the description on phones). The header sits outside the scrolling body,
   * so an action placed here never scrolls out of view. The layout is an
   * explicit flex row rather than the Card's `CardAction` slot: that slot
   * relies on a Tailwind 4 `has-data-[…]` variant the project's Tailwind 3
   * does not compile.
   */
  action?: ReactNode
}

export function PageCard({ title, description, children, action }: PageCardProps) {
  // An action alone still needs the header: it is the one place that never
  // scrolls out of view.
  const hasHeader = title || description || action

  return (
    <div className="w-[100%] mx-auto md:h-full overflow-x-hidden md:overflow-hidden">
      <Card className={`md:h-full flex flex-col overflow-x-hidden md:overflow-hidden ${!hasHeader ? 'py-0' : ''}`}>
        {hasHeader && (
          <CardHeader className="shrink-0 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1.5">
              <CardTitle className="text-2xl">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            {action && (
              <div className="shrink-0" data-testid="page-card-action">
                {action}
              </div>
            )}
          </CardHeader>
        )}
        <CardContent className="flex-1 overflow-hidden flex flex-col">{children}</CardContent>
      </Card>
    </div>
  )
}

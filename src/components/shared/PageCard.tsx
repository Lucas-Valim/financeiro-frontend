import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export interface PageCardProps {
  title: string
  description: string
  children: React.ReactNode
}

export function PageCard({ title, description, children }: PageCardProps) {
  return (
    <div className="w-[100%] mx-auto md:h-full overflow-x-hidden md:overflow-hidden">
      <Card className="md:h-full flex flex-col overflow-x-hidden md:overflow-hidden">
        <CardHeader className="shrink-0">
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-x-hidden md:overflow-hidden flex flex-col space-y-4">{children}</CardContent>
      </Card>
    </div>
  )
}

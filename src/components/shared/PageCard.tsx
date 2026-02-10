import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export interface PageCardProps {
  title: string
  description: string
  children: React.ReactNode
}

export function PageCard({ title, description, children }: PageCardProps) {
  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">{children}</CardContent>
      </Card>
    </div>
  )
}

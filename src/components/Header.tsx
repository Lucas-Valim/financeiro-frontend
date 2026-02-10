import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PLACEHOLDER_USER, TODO_MESSAGES } from '@/constants'

export function Header() {
  const handleLogout = (): void => {
    console.log(TODO_MESSAGES.LOGOUT_PLACEHOLDER)
  }

  return (
    <div className="flex items-center gap-4">
      <Card>
        <CardContent className="py-3 px-4">
          <span className="text-sm font-medium">{PLACEHOLDER_USER}</span>
        </CardContent>
      </Card>
      <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Sair" className="h-11 px-4">
        Sair
      </Button>
    </div>
  )
}

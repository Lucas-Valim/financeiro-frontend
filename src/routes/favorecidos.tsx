import { createFileRoute } from '@tanstack/react-router'
import { Favorecidos } from '@/components/pages/Favorecidos'

export const Route = createFileRoute('/favorecidos')({
  component: Favorecidos,
})

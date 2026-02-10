import { createFileRoute } from '@tanstack/react-router'
import { Relatorios } from '@/components/pages/Relatorios'

export const Route = createFileRoute('/relatorios')({
  component: Relatorios,
})

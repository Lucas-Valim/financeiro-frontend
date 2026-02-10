import { createFileRoute } from '@tanstack/react-router'
import { Despesa } from '@/components/pages/Despesa'

export const Route = createFileRoute('/despesa')({
  component: Despesa,
})

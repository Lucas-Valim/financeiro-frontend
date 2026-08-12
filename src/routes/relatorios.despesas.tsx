import { createFileRoute } from '@tanstack/react-router'
import { RelatorioDespesas } from '@/components/pages/RelatorioDespesas'

export const Route = createFileRoute('/relatorios/despesas')({
  component: RelatorioDespesas,
})

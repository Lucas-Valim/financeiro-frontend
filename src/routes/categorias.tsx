import { createFileRoute } from '@tanstack/react-router'
import { Categorias } from '@/components/pages/Categorias'

export const Route = createFileRoute('/categorias')({
  component: Categorias,
})

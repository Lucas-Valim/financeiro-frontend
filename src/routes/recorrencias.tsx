import { createFileRoute } from '@tanstack/react-router'
import { Recorrencias } from '@/components/pages/Recorrencias'

interface RecorrenciasSearch {
  /** Abre o formulário de criação ao entrar — usado pelo ponto de entrada secundário da tela de despesas. */
  novo?: boolean
}

export const Route = createFileRoute('/recorrencias')({
  validateSearch: (search: Record<string, unknown>): RecorrenciasSearch => ({
    novo: search.novo === true || search.novo === 'true',
  }),
  component: RecorrenciasRoute,
})

function RecorrenciasRoute() {
  const { novo } = Route.useSearch()
  return <Recorrencias initialCreateOpen={novo} />
}

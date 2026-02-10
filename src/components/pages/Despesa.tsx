import { PageCard } from '@/components/shared/PageCard'
import { FeatureList } from '@/components/shared/FeatureList'
import { InfoSection } from '@/components/shared/InfoSection'

export function Despesa() {
  const features = [
    { name: 'Cadastrar despesas', description: 'Adicione suas despesas diárias' },
    { name: 'Categorizar gastos', description: 'Organize por categorias (Alimentação, Transporte, etc.)' },
    { name: 'Visualizar histórico', description: 'Acompanhe todas as despesas registradas' },
    { name: 'Gerar relatórios', description: 'Exporte dados para análise detalhada' },
  ] as const

  return (
    <PageCard
      title="Gerenciamento de Despesas"
      description="Controle e organize suas despesas de forma eficiente"
    >
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">Página de Despesas em desenvolvimento...</h3>
        <p className="text-muted-foreground">Em breve você poderá:</p>
        <FeatureList items={features} />
      </div>
      <InfoSection title="Próximos passos">
        Estamos trabalhando para disponibilizar todas as funcionalidades de gerenciamento de despesas.
      </InfoSection>
    </PageCard>
  )
}

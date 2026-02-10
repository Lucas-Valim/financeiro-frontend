import { PageCard } from '@/components/shared/PageCard'
import { FeatureList } from '@/components/shared/FeatureList'
import { InfoSection } from '@/components/shared/InfoSection'

export function Relatorios() {
  const features = [
    { name: 'Relatório mensal', description: 'Resumo de todas as despesas do mês' },
    { name: 'Relatório por categoria', description: 'Análise detalhada por tipo de gasto' },
    { name: 'Comparativos', description: 'Compare períodos e identifique tendências' },
    { name: 'Exportar dados', description: 'Baixe relatórios em PDF, Excel ou CSV' },
  ] as const

  return (
    <PageCard
      title="Relatórios Financeiros"
      description="Visualize e analise seus dados financeiros de forma detalhada"
    >
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">Página de Relatórios em desenvolvimento...</h3>
        <p className="text-muted-foreground">Em breve você poderá:</p>
        <FeatureList items={features} />
      </div>
      <InfoSection title="Próximos passos">
        Estamos trabalhando para disponibilizar todas as funcionalidades de geração de relatórios.
      </InfoSection>
    </PageCard>
  )
}

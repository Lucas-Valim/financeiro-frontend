import { PageCard } from '@/components/shared/PageCard'
import { FeatureList } from '@/components/shared/FeatureList'
import { InfoSection } from '@/components/shared/InfoSection'
import { PLACEHOLDER_USER } from '@/constants'

export function Home() {
  const navigationItems = [
    { name: 'Home', description: 'Página inicial com informações do sistema' },
    { name: 'Despesa', description: 'Gerenciamento de despesas e categorias' },
    { name: 'Relatórios', description: 'Visualização de relatórios financeiros' },
  ] as const

  return (
    <PageCard
      title={`Bem-vindo ao sistema financeiro ${PLACEHOLDER_USER}`}
      description="Plataforma de treinamento e demonstração para consultoria financeira"
    >
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">Como navegar</h3>
        <p className="text-muted-foreground">
          Utilize a barra lateral para acessar as diferentes seções do sistema:
        </p>
        <FeatureList items={navigationItems} />
      </div>
      <InfoSection title="Informações da sessão">
        Você está conectado como <span className="font-medium text-foreground">{PLACEHOLDER_USER}</span>.{' '}
        Utilize o botão &quot;Sair&quot; no cabeçalho para encerrar sua sessão.
      </InfoSection>
    </PageCard>
  )
}

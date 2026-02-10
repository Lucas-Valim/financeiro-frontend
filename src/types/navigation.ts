export const PAGES = {
  HOME: 'home',
  DESPESA: 'despesa',
  RELATORIOS: 'relatorios',
} as const

export type PageId = (typeof PAGES)[keyof typeof PAGES]

export type NavigationItem = {
  id: PageId
  label: string
  icon: React.ComponentType<{ className?: string }>
}

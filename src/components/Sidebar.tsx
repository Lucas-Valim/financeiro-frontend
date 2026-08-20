import { useEffect, useState } from 'react'
import {
  Sidebar as SidebarBase,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'

import {
  Home,
  Wallet,
  BarChart3,
  Calendar,
  Tags,
  Users,
  ChevronRight,
  Receipt,
  Repeat,
  FolderCog,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { EvoluireLogo } from './EvoluireLogo'
import { PLACEHOLDER_USER } from '@/constants'
import { cn } from '@/lib/utils'

/**
 * Home abre a barra sozinha; os Cadastros vêm logo em seguida, antes das telas de
 * operação do dia a dia. A ordem é explícita na composição do JSX, e não um
 * índice dentro de uma lista só, para que mover um item seja mover uma linha.
 */
const homeItem = { to: '/', label: 'Home', icon: Home } as const

const navigationItems = [
  { to: '/calendario', label: 'Calendário', icon: Calendar, preload: true },
  { to: '/despesa', label: 'Despesa', icon: Wallet },
] as const

const REPORTS_BASE_PATH = '/relatorios'

const reportSubItems = [
  { to: '/relatorios/despesas', label: 'Despesas', icon: Receipt },
] as const

/**
 * Cadastros — os dados que o usuário configura uma vez e depois referencia ao
 * lançar despesas. Ficam agrupados para que a barra não cresça um item plano a
 * cada área de configuração nova, mantendo no primeiro nível apenas o que é de
 * uso diário.
 */
const CADASTROS_PATHS = ['/recorrencias', '/categorias', '/favorecidos'] as const

const cadastroSubItems = [
  { to: '/recorrencias', label: 'Recorrências', icon: Repeat },
  { to: '/categorias', label: 'Categorias', icon: Tags },
  { to: '/favorecidos', label: 'Favorecidos', icon: Users },
] as const

type NavSubItem = {
  readonly to: string
  readonly label: string
  readonly icon: React.ComponentType
}

type FlatNavItemData = NavSubItem & { readonly preload?: boolean }

interface FlatNavLinkProps {
  item: FlatNavItemData
  currentPath: string
  onNavigate: () => void
  onPreload: (item: FlatNavItemData) => void
}

/** Entrada plana da barra: um link direto, sem subitens. */
function FlatNavLink({ item, currentPath, onNavigate, onPreload }: FlatNavLinkProps) {
  const Icon = item.icon
  return (
    <SidebarMenuItem>
      <Link
        to={item.to}
        className="w-full"
        onClick={onNavigate}
        onMouseEnter={() => onPreload(item)}
      >
        <SidebarMenuButton
          isActive={currentPath === item.to}
          tooltip={item.label}
          aria-label={item.label}
          className="h-11"
        >
          <Icon />
          <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
        </SidebarMenuButton>
      </Link>
    </SidebarMenuItem>
  )
}

interface CollapsibleNavGroupProps {
  label: string
  icon: React.ComponentType
  subItems: readonly NavSubItem[]
  /** Verdadeiro quando a rota corrente pertence ao grupo. */
  isActive: boolean
  currentPath: string
  isOpen: boolean
  onToggle: () => void
  onNavigate: () => void
}

/**
 * Grupo colapsável da barra lateral, usado por Cadastros e por Relatórios.
 *
 * Existe como componente para que os dois grupos compartilhem a marcação em vez
 * de duplicá-la: o padrão foi escrito à mão uma vez para Relatórios, e um segundo
 * grupo copiando-o traria de volta exatamente o tipo de duplicação que este
 * trabalho está removendo.
 */
function CollapsibleNavGroup({
  label,
  icon: Icon,
  subItems,
  isActive,
  currentPath,
  isOpen,
  onToggle,
  onNavigate,
}: CollapsibleNavGroupProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={onToggle}
        isActive={isActive}
        tooltip={label}
        aria-label={label}
        aria-expanded={isOpen}
        className="h-11"
      >
        <Icon />
        <span className="group-data-[collapsible=icon]:hidden">{label}</span>
        <ChevronRight
          className={cn(
            'ml-auto transition-transform duration-200 group-data-[collapsible=icon]:hidden',
            isOpen && 'rotate-90'
          )}
        />
      </SidebarMenuButton>
      {isOpen && (
        <SidebarMenuSub>
          {subItems.map((sub) => {
            const SubIcon = sub.icon
            return (
              <SidebarMenuSubItem key={sub.to}>
                <SidebarMenuSubButton asChild isActive={currentPath === sub.to}>
                  <Link to={sub.to} onClick={onNavigate}>
                    <SubIcon />
                    <span>{sub.label}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            )
          })}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  )
}

interface SidebarProps {
  currentPath: string
}

export function Sidebar({ currentPath }: SidebarProps) {
  const { isMobile, setOpenMobile, state, setOpen } = useSidebar()

  const isReportsActive = currentPath.startsWith(REPORTS_BASE_PATH)
  const [isReportsOpen, setIsReportsOpen] = useState(isReportsActive)

  const isCadastrosActive = CADASTROS_PATHS.some((path) => currentPath === path)
  const [isCadastrosOpen, setIsCadastrosOpen] = useState(isCadastrosActive)

  // Keep each group expanded while the client navigates inside its area (and
  // pre-expand it on mount when deep linking into one of its routes).
  useEffect(() => {
    if (isReportsActive) {
      setIsReportsOpen(true)
    }
  }, [isReportsActive])

  useEffect(() => {
    if (isCadastrosActive) {
      setIsCadastrosOpen(true)
    }
  }, [isCadastrosActive])

  const handleNavigation = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const handlePreload = (item: FlatNavItemData) => {
    if (item.preload) {
      import('@/components/calendar/CalendarPage')
    }
  }

  /**
   * No rail recolhido as primitivas de submenu ficam escondidas por construção,
   * então acionar o grupo expande a barra e o grupo juntos, revelando os
   * subitens numa única interação.
   */
  const makeGroupToggle =
    (setOpenState: React.Dispatch<React.SetStateAction<boolean>>) => () => {
      if (state === 'collapsed' && !isMobile) {
        setOpen(true)
        setOpenState(true)
        return
      }
      setOpenState((open) => !open)
    }

  return (
    <SidebarBase collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 font-bold text-lg px-2 group-data-[collapsible=icon]:justify-center">
          <EvoluireLogo className="lucide lucide-sidebar" />
          <span className="group-data-[collapsible=icon]:hidden">{PLACEHOLDER_USER}</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <FlatNavLink
                item={homeItem}
                currentPath={currentPath}
                onNavigate={handleNavigation}
                onPreload={handlePreload}
              />

              <CollapsibleNavGroup
                label="Cadastros"
                icon={FolderCog}
                subItems={cadastroSubItems}
                isActive={isCadastrosActive}
                currentPath={currentPath}
                isOpen={isCadastrosOpen}
                onToggle={makeGroupToggle(setIsCadastrosOpen)}
                onNavigate={handleNavigation}
              />

              {navigationItems.map((item) => (
                <FlatNavLink
                  key={item.to}
                  item={item}
                  currentPath={currentPath}
                  onNavigate={handleNavigation}
                  onPreload={handlePreload}
                />
              ))}

              <CollapsibleNavGroup
                label="Relatórios"
                icon={BarChart3}
                subItems={reportSubItems}
                isActive={isReportsActive}
                currentPath={currentPath}
                isOpen={isReportsOpen}
                onToggle={makeGroupToggle(setIsReportsOpen)}
                onNavigate={handleNavigation}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </SidebarBase>
  )
}

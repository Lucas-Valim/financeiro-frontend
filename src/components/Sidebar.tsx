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
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { EvoluireLogo } from './EvoluireLogo'
import { PLACEHOLDER_USER } from '@/constants'
import { cn } from '@/lib/utils'

const navigationItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/calendario', label: 'Calendário', icon: Calendar, preload: true },
  { to: '/despesa', label: 'Despesa', icon: Wallet },
  { to: '/categorias', label: 'Categorias', icon: Tags },
  { to: '/favorecidos', label: 'Favorecidos', icon: Users },
] as const

const REPORTS_BASE_PATH = '/relatorios'

const reportSubItems = [
  { to: '/relatorios/despesas', label: 'Despesas', icon: Receipt },
] as const

interface SidebarProps {
  currentPath: string
}

export function Sidebar({ currentPath }: SidebarProps) {
  const { isMobile, setOpenMobile, state, setOpen } = useSidebar()

  const isReportsActive = currentPath.startsWith(REPORTS_BASE_PATH)
  const [isReportsOpen, setIsReportsOpen] = useState(isReportsActive)

  // Keep the group expanded while the client navigates inside the reports area
  // (and pre-expand it on mount when deep linking into a report route).
  useEffect(() => {
    if (isReportsActive) {
      setIsReportsOpen(true)
    }
  }, [isReportsActive])

  const handleNavigation = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const handlePreload = (item: typeof navigationItems[number]) => {
    if ('preload' in item && item.preload) {
      import('@/components/calendar/CalendarPage')
    }
  }

  const handleReportsToggle = () => {
    // In the collapsed icon rail the submenu primitives are hidden by
    // construction, so activating the group expands the bar and the group
    // together, revealing the subitem in one interaction.
    if (state === 'collapsed' && !isMobile) {
      setOpen(true)
      setIsReportsOpen(true)
      return
    }
    setIsReportsOpen((open) => !open)
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
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.to}>
                    <Link
                      to={item.to}
                      className="w-full"
                      onClick={handleNavigation}
                      onMouseEnter={() => handlePreload(item)}
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
              })}

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleReportsToggle}
                  isActive={isReportsActive}
                  tooltip="Relatórios"
                  aria-label="Relatórios"
                  aria-expanded={isReportsOpen}
                  className="h-11"
                >
                  <BarChart3 />
                  <span className="group-data-[collapsible=icon]:hidden">Relatórios</span>
                  <ChevronRight
                    className={cn(
                      'ml-auto transition-transform duration-200 group-data-[collapsible=icon]:hidden',
                      isReportsOpen && 'rotate-90'
                    )}
                  />
                </SidebarMenuButton>
                {isReportsOpen && (
                  <SidebarMenuSub>
                    {reportSubItems.map((sub) => {
                      const SubIcon = sub.icon
                      return (
                        <SidebarMenuSubItem key={sub.to}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={currentPath === sub.to}
                          >
                            <Link to={sub.to} onClick={handleNavigation}>
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </SidebarBase>
  )
}

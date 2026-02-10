import {
  Sidebar as SidebarBase,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'

import { Home, Wallet, BarChart3 } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { EvoluireLogo } from './EvoluireLogo'
import { PLACEHOLDER_USER } from '@/constants'

const navigationItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/despesa', label: 'Despesa', icon: Wallet },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
] as const

interface SidebarProps {
  currentPath: string
}

export function Sidebar({ currentPath }: SidebarProps) {
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
                    <Link to={item.to} className="w-full">
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </SidebarBase>
  )
}

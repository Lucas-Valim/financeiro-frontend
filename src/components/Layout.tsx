import { Outlet, useLocation } from '@tanstack/react-router'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import type { LayoutProps } from '@/types/layout'

export function Layout({ children }: LayoutProps = {}) {
  const location = useLocation()

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar currentPath={location.pathname} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <SidebarTrigger className="size-11 p-2" aria-label="Abrir ou fechar menu lateral" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex-1">
            <h1 className="font-semibold">Financeiro</h1>
          </div>
          <Header />
        </header>
        <main className="flex-1 p-6 overflow-x-hidden md:overflow-hidden">
          {children ?? <Outlet />}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

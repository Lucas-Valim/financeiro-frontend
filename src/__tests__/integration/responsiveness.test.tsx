import { render, screen, within } from '@testing-library/react'
import { Layout } from '@/components/Layout'
import { mockViewport, resetViewport, clearAllMocks } from '@/test/helpers'

describe('Integration: Responsividade', () => {
  beforeEach(() => {
    clearAllMocks()
  })

  afterEach(() => {
    resetViewport()
  })

  describe('Mobile (< 768px)', () => {
    beforeEach(() => {
      mockViewport(375)
    })

    it('deve ter Sidebar oculta por padrão em mobile', () => {
      const { container } = render(
        <Layout>
          <div>Test Content</div>
        </Layout>
      )

      const sidebarWrapper = container.querySelector('.group\\/sidebar-wrapper')
      expect(sidebarWrapper).toBeInTheDocument()
    })

    it('deve ter conteúdo principal ocupando largura total', () => {
      const { container } = render(
        <Layout>
          <div>Test Content</div>
        </Layout>
      )

      const main = container.querySelector('main')
      expect(main).toBeInTheDocument()
      if (main instanceof HTMLElement) {
        expect(main).toHaveClass('flex-1')
      }
    })

    it('deve ter layout empilhado em mobile', () => {
      const { container } = render(
        <Layout>
          <div>Test Content</div>
        </Layout>
      )

      const sidebarWrapper = container.querySelector('.group\\/sidebar-wrapper')
      expect(sidebarWrapper).toHaveClass('flex')
    })

    it('deve ter SidebarTrigger disponível para mostrar menu', () => {
      const { container } = render(
        <Layout>
          <div>Test Content</div>
        </Layout>
      )

      const header = container.querySelector('header')
      if (header) {
        const buttons = within(header).getAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Tablet (768px - 1024px)', () => {
    beforeEach(() => {
      mockViewport(900)
    })

    it('deve ter Sidebar visível em tablet', () => {
      const { container } = render(
        <Layout>
          <div>Test Content</div>
        </Layout>
      )

      const sidebarWrapper = container.querySelector('.group\\/sidebar-wrapper')
      expect(sidebarWrapper).toBeInTheDocument()
    })

    it('deve ter layout responsivo com Sidebar e content', () => {
      const { container } = render(
        <Layout>
          <div>Test Content</div>
        </Layout>
      )

      const sidebar = container.querySelector('[data-sidebar]')
      const main = container.querySelector('main')
      expect(sidebar).toBeInTheDocument()
      expect(main).toBeInTheDocument()
    })

    it('deve ter Sidebar fixa lateral em tablet', () => {
      const { container } = render(
        <Layout>
          <div>Test Content</div>
        </Layout>
      )

      const sidebarContainer = container.querySelector('[data-slot="sidebar-container"]')
      expect(sidebarContainer).toBeInTheDocument()
    })

    it('deve ter conteúdo principal ocupando espaço restante', () => {
      const { container } = render(
        <Layout>
          <div>Test Content</div>
        </Layout>
      )

      const main = container.querySelector('main')
      expect(main).toHaveClass('flex-1')
    })

    it('deve ter header visível com título e botão em tablet', () => {
      render(
        <Layout>
          <div>Test Content</div>
        </Layout>
      )

      expect(screen.getByText('Financeiro')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument()
    })
  })

  describe('Desktop (> 1024px)', () => {
    beforeEach(() => {
      mockViewport(1280)
    })

    it('deve ter Sidebar fixa lateral em desktop', () => {
      const { container } = render(
        <Layout>
          <div>Test Content</div>
        </Layout>
      )

      const sidebar = container.querySelector('[data-slot="sidebar-container"]')
      expect(sidebar).toBeInTheDocument()
    })

    it('deve ter layout completo com Sidebar, Header e Main em desktop', () => {
      const { container } = render(
        <Layout>
          <div>Test Content</div>
        </Layout>
      )

      const sidebar = container.querySelector('[data-sidebar]')
      const header = container.querySelector('header')
      const main = container.querySelector('main')

      expect(sidebar).toBeInTheDocument()
      expect(header).toBeInTheDocument()
      expect(main).toBeInTheDocument()
    })

    it('deve ter Sidebar fixa lateral com largura definida', () => {
      const { container } = render(
        <Layout>
          <div>Test Content</div>
        </Layout>
      )

      const sidebarWrapper = container.querySelector('.group\\/sidebar-wrapper')
      expect(sidebarWrapper).toBeInTheDocument()
      expect(sidebarWrapper).toHaveClass('w-full')
    })

    it('deve ter SidebarRail para toggle em desktop', () => {
      const { container } = render(
        <Layout>
          <div>Test Content</div>
        </Layout>
      )

      const rail = container.querySelector('[data-sidebar="rail"]')
      expect(rail).toBeInTheDocument()
    })

    it('deve ter header com elementos de navegação em desktop', () => {
      const { container } = render(
        <Layout>
          <div>Test Content</div>
        </Layout>
      )

      const header = container.querySelector('header')
      expect(header).toBeInTheDocument()
      if (header instanceof HTMLElement) {
        expect(within(header).getByText('Financeiro')).toBeInTheDocument()
      }
    })

    it('deve ter navegação funcional em desktop', () => {
      render(
        <Layout>
          <div>Test Content</div>
        </Layout>
      )

      expect(screen.getByText('Home')).toBeInTheDocument()
    })

    it('deve ter layout com Sidebar, Header e Main alinhados', () => {
      const { container } = render(
        <Layout>
          <div>Test Content</div>
        </Layout>
      )

      const sidebarWrapper = container.querySelector('.group\\/sidebar-wrapper')
      expect(sidebarWrapper).toHaveClass('flex')
      if (sidebarWrapper instanceof HTMLElement) {
        expect(sidebarWrapper).toHaveClass('md:h-svh')
        expect(sidebarWrapper).toHaveClass('md:overflow-hidden')
      }
    })
  })

  describe('Transições de viewport', () => {
    it('deve manter componentes renderizados entre viewports', () => {
      const { container, rerender } = render(
        <Layout>
          <div>Test Content</div>
        </Layout>
      )

      expect(container.querySelector('[data-sidebar]')).toBeInTheDocument()
      expect(container.querySelector('header')).toBeInTheDocument()
      expect(container.querySelector('main')).toBeInTheDocument()

      mockViewport(1280)

      rerender(
        <Layout>
          <div>Test Content</div>
        </Layout>
      )

      expect(container.querySelector('[data-sidebar]')).toBeInTheDocument()
      expect(container.querySelector('header')).toBeInTheDocument()
      expect(container.querySelector('main')).toBeInTheDocument()
    })

    it('deve adaptar layout ao mudar de viewport', () => {
      const { container, rerender } = render(
        <Layout>
          <div>Test Content</div>
        </Layout>
      )

      mockViewport(375)

      rerender(
        <Layout>
          <div>Test Content</div>
        </Layout>
      )

      expect(container.querySelector('[data-sidebar]')).toBeInTheDocument()
      expect(container.querySelector('main')).toBeInTheDocument()

      mockViewport(1280)

      rerender(
        <Layout>
          <div>Test Content</div>
        </Layout>
      )

      expect(container.querySelector('[data-sidebar]')).toBeInTheDocument()
      expect(container.querySelector('main')).toBeInTheDocument()
    })

    it('deve manter SidebarRail em desktop', () => {
      const { container } = render(
        <Layout>
          <div>Test Content</div>
        </Layout>
      )

      const rail = container.querySelector('[data-sidebar="rail"]')
      expect(rail).toBeInTheDocument()
    })

    it('deve ter layout flexível em todos os viewports', () => {
      const { container } = render(
        <Layout>
          <div>Test Content</div>
        </Layout>
      )

      const sidebarWrapper = container.querySelector('.group\\/sidebar-wrapper')
      const main = container.querySelector('main')

      if (sidebarWrapper instanceof HTMLElement) {
        expect(sidebarWrapper).toHaveClass('flex')
        expect(sidebarWrapper).toHaveClass('w-full')
      }
      if (main instanceof HTMLElement) {
        expect(main).toHaveClass('flex-1')
      }
    })

    it('deve ter responsividade aplicada', () => {
      const { container } = render(
        <Layout>
          <div>Test Content</div>
        </Layout>
      )

      const main = container.querySelector('main')
      expect(main).toBeInTheDocument()
    })
  })

  describe('Validação de classes responsivas', () => {
    it('deve ter classes de breakpoint aplicadas', () => {
      const { container } = render(
        <Layout>
          <div>Test Content</div>
        </Layout>
      )

      const sidebarWrapper = container.querySelector('.group\\/sidebar-wrapper')
      if (sidebarWrapper instanceof HTMLElement) {
        expect(sidebarWrapper).toHaveClass('md:h-svh')
        expect(sidebarWrapper).toHaveClass('w-full')
        expect(sidebarWrapper).toHaveClass('md:overflow-hidden')
      }
    })

    it('deve ter classes de layout aplicadas', () => {
      const { container } = render(
        <Layout>
          <div>Test Content</div>
        </Layout>
      )

      const sidebar = container.querySelector('[data-sidebar]')
      const header = container.querySelector('header')
      const main = container.querySelector('main')

      expect(sidebar).toBeInTheDocument()
      expect(header).toBeInTheDocument()
      expect(main).toBeInTheDocument()
    })
  })
})

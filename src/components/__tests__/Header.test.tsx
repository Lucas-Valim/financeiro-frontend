import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Header } from '../Header'
import { TODO_MESSAGES } from '@/constants'

describe('Header', () => {
  it('deve renderizar corretamente com nome do usuário "Evoluire"', () => {
    render(<Header />)
    expect(screen.getByText('Evoluire')).toBeInTheDocument()
  })

  it('deve exibir o botão de logout', () => {
    render(<Header />)
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument()
  })

  it('deve chamar handleLogout ao clicar no botão Sair', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const user = userEvent.setup()
    render(<Header />)

    const logoutButton = screen.getByRole('button', { name: 'Sair' })
    await user.click(logoutButton)

    expect(consoleSpy).toHaveBeenCalledWith(TODO_MESSAGES.LOGOUT_PLACEHOLDER)
    consoleSpy.mockRestore()
  })

  it('deve ter estrutura de Card com conteúdo', () => {
    render(<Header />)
    expect(screen.getByText('Evoluire')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument()
  })
})

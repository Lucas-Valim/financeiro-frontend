import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Combobox, type ComboboxOption } from '../combobox'

const OPTIONS: ComboboxOption[] = [
  { value: 'a', label: 'Banana', description: '111' },
  { value: 'b', label: 'Cherry', description: '222' },
  { value: 'c', label: 'Apple', description: '333' },
]

const SEARCH_PLACEHOLDER = 'Buscar...'

function renderCombobox(props: Partial<React.ComponentProps<typeof Combobox>> = {}) {
  const onValueChange = props.onValueChange ?? vi.fn()
  render(
    <Combobox
      options={OPTIONS}
      onValueChange={onValueChange}
      placeholder="Selecione um item"
      searchPlaceholder={SEARCH_PLACEHOLDER}
      {...props}
    />,
  )
  return { onValueChange }
}

describe('Combobox', () => {
  describe('Rendering', () => {
    it('renders trigger with placeholder text', () => {
      renderCombobox()

      expect(screen.getByRole('combobox')).toHaveTextContent('Selecione um item')
    })

    it('renders selected option label on the trigger when a value is set', () => {
      renderCombobox({ value: 'b' })

      expect(screen.getByRole('combobox')).toHaveTextContent('Cherry')
    })
  })

  describe('Accessibility', () => {
    it('associates an external label via the forwarded id', () => {
      render(
        <>
          <label htmlFor="payee-field">Favorecido</label>
          <Combobox
            id="payee-field"
            options={OPTIONS}
            onValueChange={vi.fn()}
            placeholder="Selecione um favorecido"
          />
        </>,
      )

      expect(
        screen.getByRole('combobox', { name: 'Favorecido' }),
      ).toBeInTheDocument()
    })

    it('forwards aria-describedby and aria-invalid to the trigger', () => {
      renderCombobox({
        'aria-describedby': 'favorecido-error',
        'aria-invalid': true,
      })

      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveAttribute('aria-describedby', 'favorecido-error')
      expect(trigger).toHaveAttribute('aria-invalid', 'true')
    })
  })

  describe('Opening and listing options', () => {
    it('opens the popover on trigger click', async () => {
      const user = userEvent.setup()
      renderCombobox()

      await user.click(screen.getByRole('combobox'))

      expect(screen.getByPlaceholderText(SEARCH_PLACEHOLDER)).toBeInTheDocument()
    })

    it('shows all options when opened', async () => {
      const user = userEvent.setup()
      renderCombobox()

      await user.click(screen.getByRole('combobox'))

      expect(screen.getByText('Banana')).toBeInTheDocument()
      expect(screen.getByText('Cherry')).toBeInTheDocument()
      expect(screen.getByText('Apple')).toBeInTheDocument()
    })

    it('renders options that have no description', async () => {
      const user = userEvent.setup()
      renderCombobox({
        options: [{ value: 'x', label: 'No Description Option' }],
      })

      await user.click(screen.getByRole('combobox'))

      expect(screen.getByText('No Description Option')).toBeInTheDocument()
    })
  })

  describe('Type-ahead filtering', () => {
    it('filters options by label on type-ahead input', async () => {
      const user = userEvent.setup()
      renderCombobox()

      await user.click(screen.getByRole('combobox'))
      await user.type(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), 'Banana')

      expect(screen.getByText('Banana')).toBeInTheDocument()
      expect(screen.queryByText('Cherry')).not.toBeInTheDocument()
      expect(screen.queryByText('Apple')).not.toBeInTheDocument()
    })

    it('filters options by description on type-ahead input', async () => {
      const user = userEvent.setup()
      renderCombobox()

      await user.click(screen.getByRole('combobox'))
      await user.type(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), '222')

      expect(screen.getByText('Cherry')).toBeInTheDocument()
      expect(screen.queryByText('Banana')).not.toBeInTheDocument()
      expect(screen.queryByText('Apple')).not.toBeInTheDocument()
    })

    it('shows the empty message when no results match the search', async () => {
      const user = userEvent.setup()
      renderCombobox({ emptyMessage: 'Nenhum resultado encontrado.' })

      await user.click(screen.getByRole('combobox'))
      await user.type(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), 'zzzzz')

      expect(
        screen.getByText('Nenhum resultado encontrado.'),
      ).toBeInTheDocument()
    })
  })

  describe('Selection', () => {
    it('calls onValueChange when an option is selected', async () => {
      const user = userEvent.setup()
      const { onValueChange } = renderCombobox()

      await user.click(screen.getByRole('combobox'))
      await user.click(screen.getByText('Banana'))

      expect(onValueChange).toHaveBeenCalledWith('a')
    })
  })

  describe('Create new action', () => {
    it('shows "Cadastrar novo" action when onCreateNew prop is provided', async () => {
      const user = userEvent.setup()
      renderCombobox({ onCreateNew: vi.fn() })

      await user.click(screen.getByRole('combobox'))

      expect(screen.getByText('Cadastrar novo')).toBeInTheDocument()
    })

    it('renders a custom create label when provided', async () => {
      const user = userEvent.setup()
      renderCombobox({
        onCreateNew: vi.fn(),
        createNewLabel: 'Cadastrar novo favorecido',
      })

      await user.click(screen.getByRole('combobox'))

      expect(
        screen.getByText('Cadastrar novo favorecido'),
      ).toBeInTheDocument()
    })

    it('calls onCreateNew when the action is clicked', async () => {
      const user = userEvent.setup()
      const onCreateNew = vi.fn()
      renderCombobox({ onCreateNew })

      await user.click(screen.getByRole('combobox'))
      await user.click(screen.getByText('Cadastrar novo'))

      expect(onCreateNew).toHaveBeenCalledTimes(1)
    })

    it('does not show "Cadastrar novo" when onCreateNew prop is not provided', async () => {
      const user = userEvent.setup()
      renderCombobox()

      await user.click(screen.getByRole('combobox'))

      expect(screen.queryByText('Cadastrar novo')).not.toBeInTheDocument()
    })
  })

  describe('Keyboard navigation', () => {
    it('closes the popover when Escape is pressed', async () => {
      const user = userEvent.setup()
      renderCombobox()

      await user.click(screen.getByRole('combobox'))
      expect(screen.getByPlaceholderText(SEARCH_PLACEHOLDER)).toBeInTheDocument()

      await user.keyboard('{Escape}')

      expect(
        screen.queryByPlaceholderText(SEARCH_PLACEHOLDER),
      ).not.toBeInTheDocument()
    })

    it('selects the focused option when Enter is pressed', async () => {
      const user = userEvent.setup()
      const { onValueChange } = renderCombobox()

      await user.click(screen.getByRole('combobox'))
      await user.type(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), 'Banana')
      await user.keyboard('{Enter}')

      expect(onValueChange).toHaveBeenCalledWith('a')
    })
  })

  describe('Loading state', () => {
    it('shows a loading indicator and hides options while loading', async () => {
      const user = userEvent.setup()
      renderCombobox({ isLoading: true, onCreateNew: vi.fn() })

      await user.click(screen.getByRole('combobox'))

      expect(screen.getByText('Carregando...')).toBeInTheDocument()
      expect(screen.queryByText('Banana')).not.toBeInTheDocument()
      expect(screen.queryByText('Cadastrar novo')).not.toBeInTheDocument()
    })
  })

  describe('Disabled state', () => {
    it('does not open when the trigger is disabled', async () => {
      const user = userEvent.setup()
      renderCombobox({ disabled: true })

      await user.click(screen.getByRole('combobox'))

      expect(
        screen.queryByPlaceholderText(SEARCH_PLACEHOLDER),
      ).not.toBeInTheDocument()
    })
  })
})

import * as React from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export interface ComboboxOption {
  value: string
  label: string
  description?: string
}

export interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  emptyMessage?: string
  searchPlaceholder?: string
  className?: string
  disabled?: boolean
  isLoading?: boolean
  onCreateNew?: () => void
  createNewLabel?: string
  id?: string
  'aria-describedby'?: string
  'aria-invalid'?: React.AriaAttributes['aria-invalid']
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = 'Selecione...',
  emptyMessage = 'Nenhum resultado encontrado.',
  searchPlaceholder = 'Buscar...',
  className,
  disabled = false,
  isLoading = false,
  onCreateNew,
  createNewLabel = 'Cadastrar novo',
  id,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const selectedOption = options.find((option) => option.value === value)

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue)
    setOpen(false)
  }

  const handleCreateNew = () => {
    setOpen(false)
    onCreateNew?.()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
          disabled={disabled}
          className={cn('w-full justify-between font-normal', className)}
        >
          <span
            className={cn('truncate', !selectedOption && 'text-muted-foreground')}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0 pointer-events-auto"
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Carregando...
              </div>
            ) : (
              <>
                <CommandEmpty>{emptyMessage}</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={`${option.label} ${option.description ?? ''}`}
                      onSelect={() => handleSelect(option.value)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4 shrink-0',
                          value === option.value ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <span className="flex flex-col">
                        <span className="truncate">{option.label}</span>
                        {option.description && (
                          <span className="truncate text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        )}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
          {onCreateNew && !isLoading && (
            <div className="border-t p-1">
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start font-normal"
                onClick={handleCreateNew}
              >
                <Plus className="mr-2 h-4 w-4 shrink-0" />
                {createNewLabel}
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}

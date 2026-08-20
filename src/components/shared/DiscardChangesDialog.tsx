import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface DiscardChangesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Volta ao formulário, preservando o que já foi preenchido. */
  onKeepEditing: () => void;
  /** Descarta as alterações e fecha o formulário. */
  onDiscard: () => void;
}

/**
 * Confirmação de descarte quando o formulário está sujo, compartilhada pelos
 * modais de despesa e de recorrência.
 *
 * Segue o padrão de confirmação do repositório (`ExpenseCancelDialog`): `Dialog`
 * puro, porque `alert-dialog` não existe em `src/components/ui/`. Deve ser sempre
 * renderizada como **irmã** do formulário, nunca dentro do `DialogContent` dele —
 * `Dialog` Radix aninhado em `Dialog` empilha dois focus traps e dois portais.
 */
export function DiscardChangesDialog({
  isOpen,
  onOpenChange,
  onKeepEditing,
  onDiscard,
}: DiscardChangesDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Alterações não salvas</DialogTitle>
          <DialogDescription>
            Você tem alterações não salvas. Deseja descartar as alterações e sair?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onKeepEditing}
            className="w-full sm:w-auto"
          >
            Continuar Editando
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onDiscard}
            className="w-full sm:w-auto"
          >
            Descartar e Sair
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

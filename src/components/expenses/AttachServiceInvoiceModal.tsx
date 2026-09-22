import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileUpload } from '@/components/ui/file-upload';
import { useAttachServiceInvoice } from '@/hooks/useAttachServiceInvoice';
import { ATTACH_SERVICE_INVOICE_ERROR_MESSAGES } from '@/constants/expenses';
import {
  EXPENSE_FILE_ALLOWED_TYPES,
  EXPENSE_FILE_ALLOWED_TYPES_DISPLAY,
  EXPENSE_FILE_MAX_SIZE,
} from '@/schemas/expense-form-schema';
import type { ExpenseDTO } from '@/types/expenses';

export interface AttachServiceInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: ExpenseDTO;
}

/**
 * Envio da nota de serviço de uma despesa já paga — o caso em que o fornecedor
 * emite a nota depois do pagamento e o formulário de edição está fechado.
 *
 * É um modal próprio, e não a aba "Documentos" do formulário de despesa: aquele
 * abre somente-leitura na despesa paga (porque valor, vencimento e favorecido
 * seguem imutáveis), e destravar um campo isolado ali confundiria o que pode e o
 * que não pode ser alterado. Aqui só existe um campo, e ele é o que o backend
 * aceita.
 */
export function AttachServiceInvoiceModal({
  isOpen,
  onClose,
  expense,
}: AttachServiceInvoiceModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const { mutateAsync, isPending } = useAttachServiceInvoice();

  const hasExistingInvoice = expense.serviceInvoiceUrl !== null;

  /**
   * Limpa o arquivo escolhido AO FECHAR, e não ao abrir: o componente fica
   * montado entre as aberturas (como os demais modais da lista), e resetar no
   * corpo de um `useEffect` é barrado pelo eslint
   * (`react-hooks/set-state-in-effect`). Todos os caminhos de saída passam por
   * aqui, então a próxima abertura começa com o campo vazio.
   */
  const closeModal = useCallback(() => {
    setFile(null);
    onClose();
  }, [onClose]);

  const handleConfirm = useCallback(async () => {
    if (!file) {
      toast.error(ATTACH_SERVICE_INVOICE_ERROR_MESSAGES.FILE_REQUIRED);
      return;
    }

    try {
      await mutateAsync({ id: expense.id, serviceInvoice: file });
      toast.success('Nota de serviço anexada com sucesso');
      closeModal();
    } catch {
      // A mensagem em pt-BR já é exibida por useAttachServiceInvoice.onError; o
      // modal continua aberto com o arquivo escolhido, para o usuário tentar de
      // novo sem selecioná-lo outra vez.
    }
  }, [file, mutateAsync, expense.id, closeModal]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && !isPending) closeModal();
    },
    [closeModal, isPending]
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Anexar Nota de Serviço</DialogTitle>
          <DialogDescription>
            {hasExistingInvoice
              ? `A nota atual de "${expense.description}" será substituída pelo arquivo enviado.`
              : `Envie a nota de serviço da despesa "${expense.description}".`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="attach-service-invoice-upload">Nota de Serviço</Label>
          <FileUpload
            id="attach-service-invoice-upload"
            value={file}
            onChange={setFile}
            existingUrl={expense.serviceInvoiceUrl}
            acceptedTypes={EXPENSE_FILE_ALLOWED_TYPES}
            maxSize={EXPENSE_FILE_MAX_SIZE}
            allowedTypesDisplay={EXPENSE_FILE_ALLOWED_TYPES_DISPLAY}
            disabled={isPending}
            documentLabel="Nota de Serviço"
            downloadFileName={expense.description}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={closeModal}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            {isPending ? 'Enviando...' : 'Salvar Nota'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

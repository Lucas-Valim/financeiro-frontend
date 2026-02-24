<critical>
  Esta é uma tarefa APENAS de frontend
</critical>

voce acabou de implementar o @promp-base.md, agora preciso que crie um um botão nessa tela para criação dessa despesa. o backend @financeiro-backend já possui esse endpoint criado, faça curl para POST http://localhost:3000/expenses <expense_create_json> para entender o retorno da api para validações. 
Preciso que esse modal tenha os campos <expense_fields>. O sistema já possui um componente de pagina de despesas com componentes já criado como Modal e outros.. @src/components/pages/Despesa.tsx
- ao fechar esse modal ele deve dar uma resposta de sucesso se criação ok, e uma mensagem de erro se der algum erro para criar o registro, não fechar o modal, exibir a mensagem e bloquear o botão de salvar (evitar multiplas chamadas para API com erro).
- o componente @src/components/expenses-grid/ExpensesGrid.tsx possui um botão (DropdownMenuItem line 73) para edição/ vizualização de uma despesa por id. Porém, esse botão hoje está sem comportamento nenhum. Nessa tarefa vai contemplar usar o mesmo modal da criação da despesa para edição também. Quanfo for chamado o modal para edição, os campos do formulario devem estar prenchidos com os valores vindo da api @financeiro-backend/src/infrastructure/controllers/expense.controller.ts (linha 108) e ao mudar os valores, mandar para o endpoint de edição @financeiro-backend/src/infrastructure/controllers/expense.controller.ts (124). ao fechar esse modal ele deve dar uma resposta de sucesso se a edição foi ok, e uma mensagem de erro se der algum erro para editar o registro e NÃO bloquear o botão de salvar, para permitir o usuário realizar alterações

<critical>
  **VOCE DEVE** ler o @/Users/lucasborges/Principal/evoluire/financeiro/financeiro-frontend/README.md.md para entender como funciona o projeto. 
  **VOCE DEVE** Usar o Playwright MCP para testar as implementações com o browser.
  **VOCE DEVE** fazer perguntas para clarificacao
</critical>


<expense_fields>
  Descrição -> description (string)
  Valor -> amount (number)
  Data de Vencimento -> dueDate (date)
  Fornecedor-> receiver (string)
  Município-> municipality (string)
  Método de Pagamento-> paymentMethod (string)
  organizationId - "fca3c088-ba34-43a2-9b32-b2b1a1246915"
</expense_fields>

<expense_create_json>
  {
	"description": "despesa teste",
	"amount": 150,
	"dueDate": "2026-02-13 08:30",
	"receiver": "Luis Henrique Cony",
	"municipality": "Porto Alegre",
	"paymentMethod": "PIX",
	"organizationId": "fca3c088-ba34-43a2-9b32-b2b1a1246915"
}
</expense_create_json>
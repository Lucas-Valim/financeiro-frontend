no projeto @financeiro-backend foi adicionado o campo bankBill no @src/infrastructure/controllers/schemas/expense.schema.ts e adicionado as tratativas nos uses cases e em outras camadas. analise o comportamento no backend para fazer a ligação do projeto @financeiro-frontend com a api. @financeiro-frontend/src/components/expenses/ExpenseUploadFields.tsx é responsavel pelo upload dos arquivos bankBill e serviceInvoice, porem no @financeiro-frontend/src/hooks/useExpenseForm.ts não esta enviando esses campos para api. 

<task_goal>
frontend conseguir criar uma despesa eviando os arquivos bankBill e serviceInvoice para api.
</task_goal>

<critical>
  **VOCE DEVE** ler o @/Users/lucasborges/Principal/evoluire/financeiro/financeiro-frontend/README.md.md para entender como funciona o projeto. 
  **VOCE DEVE** fazer perguntas para clarificacao
</critical>

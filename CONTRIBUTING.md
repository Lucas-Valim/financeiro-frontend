# Contributing Guidelines

## Convenções de Código

### TypeScript

- Todos os componentes devem ser escritos em TypeScript (`.tsx`)
- Props devem ser tipadas explicitamente
- Use tipos compartilhados de `src/types/` quando possível
- Execute `npm run typecheck` antes de commitar

### Estilo de Código

- Siga os padrões estabelecidos no codebase existente
- Use ESLint com `npm run lint` para garantir conformidade
- Mantenha as funções pequenas e focadas (princípio KISS)
- Evite duplicação de código (princípio DRY)

## Fluxo para Adicionar Novos Componentes

1. **Criar Componente**
   - Crie o arquivo em `src/components/` (ou `src/components/pages/` para páginas)
   - Use TypeScript (`.tsx` extensão)
   - Adicione tipos para as props

2. **Adicionar Componente ShadCN (se necessário)**
   ```bash
   npx shadcn add <nome-componente>
   ```

3. **Criar Testes**
   - Crie arquivo de teste em `src/components/__tests__/`
   - Nomeie como `<ComponentName>.test.tsx`
   - Use React Testing Library e Vitest

4. **Rodar Verificações**
   ```bash
   npm run lint
   npm run typecheck
   npm test
   ```

## Rodar Testes e Lint

### Lint
```bash
npm run lint
```

### Typecheck
```bash
npm run typecheck
```

### Testes Unitários
```bash
# Watch mode
npm test

# Single run
npm run test:run

# Com UI
npm run test:ui
```

### Testes de Integração
```bash
npm run test:run -- src/__tests__/integration/
```

## Uso de Playwright MCP para Testes E2E

Este projeto utiliza o Playwright MCP para testes end-to-end automatizados através de automação de navegadores.

### Executar Testes E2E

Os testes E2E podem ser executados através do Playwright MCP. Consulte a documentação específica do MCP para detalhes sobre como executar testes E2E em seu ambiente.

### Escrever Testes E2E

Para novos testes E2E:
1. Crie testes que verifiquem fluxos de usuário completos
2. Use os seletores apropriados do Playwright
3. Verifique estados, navegação e interações
4. Mantenha os testes independentes e determinísticos

## Commit Standards

Use mensagens de commit claras e descritivas:
- `feat: adicionar funcionalidade X`
- `fix: corrigir bug Y`
- `docs: atualizar documentação`
- `refactor: refatorar código`
- `test: adicionar testes`
- `chore: tarefas de manutenção`

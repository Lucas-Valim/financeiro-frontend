# Evoluire Financial Management

Sistema financeiro para plataforma de treinamento e demonstração da consultoria financeira.

## Sobre

Este projeto usa **Vite** como bundler e ferramenta de build, não Next.js. Os componentes de UI são baseados em **ShadCN UI**, que utiliza diretivas `"use client"` por padrão para Next.js. No contexto deste projeto (React SPA + Vite), estas diretivas são inócuas e podem ser ignoradas.

## Tecnologias

- **React 19.2.0** - Framework de UI
- **Vite 7.2.4** - Build tool
- **TypeScript** - Tipagem estática
- **TanStack Router** - Gerenciamento de rotas
- **ShadCN UI** - Componentes de UI
- **Tailwind CSS** - Framework CSS
- **Vitest** - Framework de testes

## Scripts Disponíveis

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview de produção
npm run preview

# Executar lint
npm run lint

# Executar typecheck
npm run typecheck

# Executar testes
npm test

# Executar testes com UI
npm run test:ui

# Executar testes uma única vez
npm run test:run
```

## TypeScript

O projeto utiliza TypeScript para garantir type-safety. Tipos compartilhados estão localizados em `src/types/`:

- `navigation.ts`: Tipos de navegação (PageId, PAGES constant, NavigationItem)
- `layout.ts`: Tipos de componentes de layout

Para executar verificação de tipos:
```bash
npm run typecheck
```

## Navegação

Este projeto utiliza **TanStack Router** para gerenciamento de rotas. Rotas estão definidas em `src/routes/`:

- `/` - Página inicial (Home)
- `/despesa` - Gerenciamento de despesas
- `/relatorios` - Relatórios financeiros

## Estrutura do Projeto

```
src/
├── components/
│   ├── ui/                # Componentes ShadCN
│   ├── Layout.tsx          # Layout principal com Sidebar e Header
│   ├── Sidebar.tsx        # Navegação lateral
│   ├── Header.tsx         # Header com informações do usuário
│   ├── EvoluireLogo.tsx    # Componente de logo
│   ├── pages/              # Páginas da aplicação
│   │   ├── Home.tsx
│   │   ├── Despesa.tsx
│   │   └── Relatorios.tsx
│   └── __tests__/         # Testes unitários dos componentes
├── types/                  # Tipos TypeScript compartilhados
│   ├── navigation.ts
│   └── layout.ts
├── routes/                 # Definições de rotas (TanStack Router)
│   ├── __root.tsx
│   ├── index.tsx
│   ├── despesa.tsx
│   └── relatorios.tsx
├── lib/
│   └── utils.ts           # Utilitários
├── test/
│   ├── setup.ts            # Setup de testes Vitest
│   └── helpers.ts          # Helpers de teste
├── __tests__/              # Testes de integração
│   └── integration/
└── main.tsx                # Ponto de entrada
```

## Funcionalidades

- **Navegação** - Sidebar com 3 itens (Home, Despesa, Relatórios)
- **Responsividade** - Layout adaptativo para mobile, tablet e desktop
- **Header** - Exibe nome do usuário e botão de logout
- **Home Page** - Mensagem de boas-vindas em português

## Testes

O projeto utiliza Vitest para testes com React Testing Library.

### Executar Testes

```bash
# Executar testes em modo watch
npm test

# Executar testes com UI (interface visual)
npm run test:ui

# Executar testes uma única vez
npm run test:run
```

### Estrutura de Testes

- Testes unitários: Localizados em `src/components/__tests__/`
- Testes de integração: Localizados em `src/__tests__/integration/`
- Helpers de teste: Localizados em `src/test/helpers.ts`

### Testes E2E com Playwright MCP

Este projeto suporta testes E2E usando o Playwright MCP para automação de navegadores. Consulte o `CONTRIBUTING.md` para mais informações sobre como executar testes E2E.

## Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Executar lint e typecheck em paralelo
npm run lint && npm run typecheck

# Executar testes em modo watch
npm test
```

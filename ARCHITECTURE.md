# Arquitetura

## Estrutura de Componentes

```
src/
├── components/
│   ├── Layout.tsx          # Layout principal com Sidebar e Header
│   ├── Sidebar.tsx         # Navegação lateral
│   ├── Header.tsx          # Header com informações do usuário
│   ├── EvoluireLogo.tsx    # Componente de logo
│   ├── pages/              # Páginas da aplicação
│   │   ├── Home.tsx
│   │   ├── Despesa.tsx
│   │   └── Relatorios.tsx
│   └── ui/                # Componentes ShadCN
├── types/                  # Tipos TypeScript compartilhados
│   ├── navigation.ts
│   └── layout.ts
├── routes/                 # Definições de rotas (TanStack Router)
└── test/                   # Configuração e utilitários de teste
```

## Padrões de Teste

- Testes unitários: Localizados em `src/components/__tests__/`
- Testes de integração: Localizados em `src/__tests__/integration/`
- Helpers de teste: Localizados em `src/test/helpers.ts`

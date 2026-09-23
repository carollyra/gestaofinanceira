# Controle Financeiro Pessoal

Aplicação full stack para controle de finanças pessoais: contas, categorias, transações,
recorrências, orçamentos, metas de economia, importação de CSV e dashboard com gráficos.

> Projeto em desenvolvimento.

## Stack

| Camada   | Tecnologias                                     |
| -------- | ----------------------------------------------- |
| Frontend | React, TypeScript, Vite, Tailwind CSS, Recharts |
| Backend  | Node.js, TypeScript, Express, Zod, JWT, bcrypt  |
| Banco    | PostgreSQL (Neon) com Prisma ORM                |
| Testes   | Vitest, Supertest, Testing Library              |
| Tooling  | ESLint, Prettier                                |

## Decisões técnicas

- **Dinheiro como inteiro em centavos.** Nenhum valor monetário é armazenado ou calculado em
  ponto flutuante; a conversão acontece apenas na borda (entrada do usuário e exibição).
- **Paginação, filtros e ordenação no servidor** em toda listagem de transações.
- **Agregações no banco.** Totais, somatórios por categoria e evolução mensal são calculados
  por query SQL, não em memória no Node.
- **Isolamento por usuário.** Todo acesso a dados é escopado ao usuário autenticado.

## Estrutura

```
.
├── backend/
│   ├── prisma/          # schema, migrations e seed
│   └── src/
│       ├── controllers/
│       ├── middlewares/
│       ├── routes/
│       ├── schemas/     # validação com Zod
│       ├── services/    # regras de negócio
│       └── utils/
└── frontend/
    └── src/
        ├── components/
        ├── contexts/
        ├── hooks/
        ├── pages/
        ├── services/    # cliente HTTP
        └── utils/
```

## Como rodar localmente

Pré-requisitos: Node.js 22.12+ e um banco PostgreSQL (ex.: [Neon](https://neon.tech)).

### Backend

```bash
cd backend
cp .env.example .env   # preencha DATABASE_URL, DIRECT_URL e JWT_SECRET
npm install
npm run dev            # http://localhost:3333/api/health
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev            # http://localhost:5173
```

## Scripts

Disponíveis em `backend/` e `frontend/`:

| Script              | Descrição                   |
| ------------------- | --------------------------- |
| `npm run dev`       | Servidor de desenvolvimento |
| `npm run build`     | Build de produção           |
| `npm run typecheck` | Checagem de tipos           |
| `npm run lint`      | ESLint                      |
| `npm run format`    | Prettier                    |
| `npm test`          | Testes com Vitest           |

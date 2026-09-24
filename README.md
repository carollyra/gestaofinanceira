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
- **Isolamento por usuário.** Todo acesso a dados é escopado ao usuário autenticado. Além do
  filtro na aplicação, as relações entre tabelas do usuário usam chaves estrangeiras compostas
  (`[account_id, user_id] -> accounts[id, user_id]`), então o próprio banco rejeita uma transação
  que aponte para a conta ou categoria de outro usuário.
- **Integridade no banco.** Constraints `CHECK` garantem valores positivos, cores em hex, dia de
  recorrência válido e mês de orçamento sempre no dia 1. Recorrências têm índice único
  `(recurring_transaction_id, date)`, o que torna a geração de ocorrências idempotente.
- **Datas sem fuso.** Datas de transação usam o tipo `date` do PostgreSQL, sem horário.

## Modelagem

`User` · `Account` (saldo inicial) · `Category` (receita/despesa, cor, ícone) · `Transaction` ·
`RecurringTransaction` (semanal, mensal, anual) · `Budget` (limite por categoria e mês) ·
`Goal` (valor alvo, valor atual, prazo). O schema completo está em
[`backend/prisma/schema.prisma`](backend/prisma/schema.prisma).

## API

Base: `/api`. Rotas autenticadas exigem `Authorization: Bearer <token>`. Erros seguem o formato
`{ "message": string, "details"?: { campo: string[] } }`.

| Método | Rota             | Auth | Descrição                            |
| ------ | ---------------- | ---- | ------------------------------------ |
| GET    | `/health`        |      | Health check                         |
| POST   | `/auth/register` |      | Cadastro (cria as categorias padrão) |
| POST   | `/auth/login`    |      | Login, retorna `{ user, token }`     |
| GET    | `/auth/me`       | ✓    | Usuário autenticado                  |

Segurança da autenticação: senhas com bcrypt, JWT HS256 com algoritmo fixado na verificação,
rate limit em login/cadastro, mesma mensagem e mesmo tempo de resposta para e-mail inexistente
e senha errada (evita enumeração de usuários).

Regras de negócio: o saldo da conta é calculado em uma única query (`saldo inicial + receitas −
despesas`); conta com transações não pode ser excluída, apenas arquivada; o tipo da categoria é
imutável; ao excluir uma categoria, suas transações passam para a categoria substituta do mesmo
tipo ou ficam sem categoria.

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
npm install            # também gera o Prisma Client
npm run db:migrate     # aplica as migrations
npm run db:seed        # usuário demo com categorias, contas e 12 meses de transações
npm run dev            # http://localhost:3333/api/health
```

Login demo: `demo@financas.dev` / `demo12345`.

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

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
- **Transferências em tabela própria.** Mover dinheiro entre contas (pagar a fatura do cartão,
  sacar para a carteira) não é receita nem despesa. Por isso transferências ficam na tabela
  `transfers`, e não como um tipo de transação: totais de entrada/saída e relatórios por categoria
  leem apenas `transactions`, então é impossível uma transferência inflar esses números. Elas
  entram só no saldo das contas, e o saldo total não muda (o que sai de uma conta entra na outra).
- **Datas sem fuso.** Datas de transação usam o tipo `date` do PostgreSQL, sem horário.

## Modelagem

`User` · `Account` (saldo inicial) · `Category` (receita/despesa, cor, ícone) · `Transaction` ·
`RecurringTransaction` (semanal, mensal, anual) · `Budget` (limite por categoria e mês) ·
`Transfer` (conta de origem → conta de destino) · `Goal` (valor alvo, valor atual, prazo). O schema completo está em
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

### Listagem de transações

`GET /transactions` aceita, todos opcionais:

| Parâmetro                | Exemplo                       | Descrição                                                        |
| ------------------------ | ----------------------------- | ---------------------------------------------------------------- |
| `page`, `pageSize`       | `page=2&pageSize=50`          | Paginação (padrão 1 e 20; máximo 100 por página)                 |
| `startDate`, `endDate`   | `startDate=2026-09-01`        | Período (inclusivo, `AAAA-MM-DD`)                                |
| `type`                   | `type=EXPENSE`                | `INCOME` ou `EXPENSE`                                            |
| `accountId`              | `accountId=<uuid>`            | Conta                                                            |
| `categoryId`             | `categoryId=none`             | Categoria, ou `none` para sem categoria                          |
| `search`                 | `search=conta luz`            | Cada palavra precisa aparecer na descrição ou nas observações    |
| `minAmount`, `maxAmount` | `minAmount=1000`              | Faixa de valor em centavos                                       |
| `sortBy`, `sortOrder`    | `sortBy=amount&sortOrder=asc` | `date`, `amount`, `description`, `createdAt`; padrão `date desc` |

Resposta: `{ data, meta: { page, pageSize, total, totalPages }, summary: { income, expense, balance } }`.
O `summary` soma todo o conjunto filtrado, não só a página atual. A busca usa `ILIKE` com índices
trigram (`pg_trgm`) e escapa os curingas `%` e `_`. A ordenação sempre desempata pelo id (UUIDv7),
então as páginas não repetem nem pulam registros.

### Transações recorrentes

Um modelo tem frequência semanal (dia da semana 0–6), mensal (dia 1–31; dia 31 cai no último dia
dos meses menores) ou anual (dia do mês de início), data de início e data final opcional. As
ocorrências vencidas até hoje (no fuso `APP_TIMEZONE`) viram transações normais, geradas ao criar
ou editar o modelo, por um agendador dentro do servidor (`RECURRING_JOB_INTERVAL_MINUTES`), pelo
endpoint `/generate` ou por `npm run jobs:recurring` (para um cron externo).

A geração não duplica mesmo rodando várias vezes ou em paralelo:

1. Cada execução avança `last_run_date` com um `UPDATE ... WHERE last_run_date = <valor lido>`
   dentro de uma transação. O `UPDATE` trava a linha; uma execução concorrente espera, não encontra
   mais o valor antigo e não gera nada.
2. O índice único `(recurring_transaction_id, date)` com `ON CONFLICT DO NOTHING` é uma segunda
   barreira.
3. Como a geração sempre começa depois de `last_run_date`, uma ocorrência excluída de propósito
   pelo usuário não é recriada. Ao retomar um modelo pausado, o período pausado não é preenchido
   retroativamente.

### Dashboard

As agregações são feitas inteiramente no PostgreSQL: `SUM ... FILTER` para receitas e despesas do
mês e do mês anterior em uma única varredura, `generate_series` para incluir meses sem movimento na
evolução, função de janela (`SUM() OVER (ORDER BY mês)`) para o saldo de fechamento acumulado e
`SUM(SUM(total)) OVER ()` para o percentual de cada categoria. Transferências não entram em
nenhuma dessas somas. O "mês atual" é calculado no fuso `APP_TIMEZONE` (padrão
`America/Sao_Paulo`), não no relógio UTC do servidor.

Regras de negócio: o saldo da conta é calculado em uma única query (`saldo inicial + receitas −
despesas + transferências recebidas − transferências enviadas`); conta com transações não pode ser excluída, apenas arquivada; a categoria de uma transação precisa ser do mesmo tipo (receita/despesa); contas arquivadas não
recebem novas movimentações; o tipo da categoria é imutável; ao excluir uma categoria, suas transações passam para a categoria substituta do mesmo
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

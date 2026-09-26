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

### Orçamentos

O gasto de cada orçamento é somado no banco com um `LEFT JOIN LATERAL` sobre as despesas da
categoria no mês do orçamento. A listagem também traz o total orçado, o total gasto e o gasto em
categorias sem orçamento no mês. O status é `OK` abaixo de 80% do limite, `WARNING` de 80% até o
limite e `EXCEEDED` acima dele. A comparação é feita em centavos inteiros, e não no percentual
arredondado: 1 centavo acima do limite já é `EXCEEDED`, mesmo que o percentual exibido seja 100%.

### Metas

Cada meta retorna `progress` com percentual (pode passar de 100%), valor restante, dias até o
prazo, valor mensal necessário (arredondado para cima, para garantir que a meta seja atingida) e
status: `COMPLETED`, `ON_TRACK`/`BEHIND` (comparando com um plano linear da criação até o prazo),
`OVERDUE` ou `NO_DEADLINE`. Depósitos e retiradas são um único `UPDATE` atômico
(`current = current ± valor`) com a condição no `WHERE`: requisições simultâneas não se
sobrescrevem e uma retirada nunca deixa a meta negativa.

### Importação de CSV

Fluxo em duas etapas, sem estado no servidor: o preview analisa o arquivo e devolve as linhas; a
confirmação recebe as linhas revisadas e valida tudo de novo (nunca confia no preview).

- **Leitura:** detecta a codificação (UTF-8 ou Windows-1252, comum em bancos brasileiros), o
  separador (`,` `;` tab `|`) e as colunas pelo nome (data, descrição/histórico, valor ou
  crédito/débito, tipo, categoria), inclusive quando o banco coloca linhas de cabeçalho antes da
  tabela. Linhas de saldo são ignoradas. Também aceita mapeamento manual de colunas e inversão de
  sinal (faturas de cartão listam compras como valores positivos).
- **Valores:** `1.234,56`, `R$ -45,90`, `(123,45)`, `1,234.56` etc. são convertidos para centavos
  com aritmética de strings e inteiros, sem ponto flutuante.
- **Erros por linha:** data impossível, valor inválido ou descrição ausente marcam só aquela linha,
  com o número da linha no arquivo.
- **Duplicatas:** `EXACT` (mesma data, valor, tipo e descrição, ignorando acentos e maiúsculas) ou
  `POSSIBLE` (mesmo valor e tipo em até 2 dias). Cada transação existente casa com no máximo uma
  linha: dois cafés iguais no arquivo contra um já lançado resultam em uma duplicata e uma nova.
- **Categorização:** coluna de categoria do CSV → categoria mais usada pelo usuário para a mesma
  descrição (histórico) → regras por palavra-chave (Uber → Transporte, Netflix → Assinaturas...).
- **Confirmação:** roda numa transação com `pg_advisory_xact_lock` por conta e pula duplicatas
  exatas por padrão, então confirmar duas vezes (ou em paralelo) não duplica a importação.

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

## Frontend

- **Autenticação:** contexto React com o usuário e o status da sessão. Ao abrir o app, um token
  salvo só é aceito depois de validado em `/auth/me`; qualquer resposta 401 durante o uso encerra a
  sessão. Rotas protegidas redirecionam para o login e voltam para a página pedida depois de entrar.
- **Formulários:** React Hook Form + Zod. As regras de senha (8+ caracteres, uma letra, um número)
  são as mesmas do backend, para feedback imediato, com um checklist que marca cada requisito
  enquanto a pessoa digita; o servidor continua validando, e os erros de campo retornados pela API
  aparecem no input correspondente.
- **Acessibilidade:** labels associados, `aria-invalid` e `aria-describedby` nos erros, botão de
  mostrar/ocultar senha com `aria-label` e `aria-pressed`, alertas com `role="alert"`.
- **Dashboard:** cards de resumo (saldo total, receitas e despesas do mês com variação contra o mês
  anterior, resultado e taxa de economia), evolução do saldo, receitas x despesas e despesas por
  categoria. O mês fica na URL (`?mes=2026-09`) e é o único filtro, acima de todos os blocos, que
  sempre mostram o mesmo recorte. Dados com TanStack Query: ao trocar de mês, o conteúdo anterior
  fica esmaecido até os novos dados chegarem, sem piscar esqueletos.
- **Gráficos (Recharts):** paleta categórica validada para daltonismo contra a superfície escura
  (receitas e despesas usam os slots azul e laranja; verde/vermelho ficam reservados para status),
  uma única escala por gráfico, linhas de 2px, barras de no máximo 24px, rótulo só no último ponto
  e tooltip com crosshair. Despesas por categoria usam barras horizontais ordenadas (não pizza), monocromáticas na cor
  semântica de despesa: o maior valor na cor cheia e os seguintes progressivamente mais suaves
  (mesmo matiz, gerado em OKLCH, contraste de 4,6:1 a 2,2:1 contra o card); ponto e barra de cada
  item têm exatamente a mesma cor, e nome, valor e percentual seguem visíveis. Listas de receitas
  usam a mesma regra com o azul de receita. A cauda é agrupada em "Outras". Todo
  gráfico tem uma visualização em tabela equivalente. No celular, receitas x despesas mostra os
  últimos 6 meses.
- **Transações:** busca (espera a pessoa parar de digitar antes de consultar a API), período (mês,
  intervalo personalizado ou tudo), tipo, conta e categoria (inclusive "sem categoria"), ordenação
  por data, valor ou descrição, e paginação com totais do filtro inteiro. Todos os filtros ficam na
  URL em português (`/transacoes?mes=2026-09&tipo=despesa&busca=mercado&pagina=2`), então a lista
  pode ser compartilhada e sobrevive a recarregar e voltar. Tabela com cabeçalhos ordenáveis
  (`aria-sort`) no desktop; no celular, cartões agrupados por dia, filtros recolhidos atrás de um
  botão e navegação fixa na parte de baixo da tela.
- **Formulário de transação:** criar e editar no mesmo modal (acessível: foco preso, Esc fecha,
  foco volta a quem abriu). O campo de valor funciona como app de banco (os dígitos entram pelos
  centavos: "1250" vira R$ 12,50) e converte para centavos inteiros ali mesmo. As categorias
  mostradas seguem o tipo (receita/despesa). Na edição, o PATCH envia só os campos alterados, o
  que permite corrigir uma transação antiga de uma conta arquivada. Excluir pede confirmação,
  remove a linha na hora (atualização otimista, com colapso animado) e a devolve se a API falhar.
  Toda mudança atualiza lista, dashboard, saldos e orçamentos (invalidação das queries).
- **Animações (Framer Motion):** toda animação comunica origem, mudança ou hierarquia. São todas
  molas físicas sem bounce, com duração total de no máximo 350 ms, e nenhuma atrasa a leitura do
  dado (a primeira renderização mostra os valores direto). Gráficos entram uma única vez ao
  aparecer na tela (linha revelada da esquerda para a direita, barras crescendo da base, receitas e
  depois despesas); a curva do Recharts é a de uma mola criticamente amortecida. Valores dos cards
  contam do anterior para o novo quando o mês muda; o conteúdo chega do lado da seta clicada;
  barras de categoria preenchem com 40 ms entre itens; linhas da lista entram em cascata e, ao
  reordenar ou sair, as demais deslizam para o novo lugar (layout animation); gráfico e tabela
  trocam em crossfade; cards elevam no hover; modais crescem a partir do botão que os abriu.
  Carregamentos usam skeletons com a forma do conteúdo, sem spinners. Com
  `prefers-reduced-motion`, deslocamentos e contagens são removidos e só a opacidade muda.
- **Token:** guardado no `localStorage` por simplicidade. Em produção, um cookie `httpOnly`
  reduziria a exposição a XSS, ao custo de exigir proteção contra CSRF.

## Testes

```bash
cd backend
npm run test:unit         # sem banco: parsing de CSV, regras de recorrência, schemas, filtros
npm run test:integration  # contra um banco PostgreSQL real e descartável
npm test                  # os dois
npm run test:coverage

cd frontend
npm test                  # componentes e páginas com Testing Library (API simulada)
```

Os testes de integração usam `DATABASE_URL_TEST`, um banco separado cujas tabelas são apagadas a
cada execução (o setup se recusa a rodar se a URL for igual à de desenvolvimento ou se o nome do
banco não contiver `test`). As migrations são aplicadas automaticamente antes dos testes. Cada
teste cria seus próprios usuários, então os arquivos rodam em paralelo.

O que é coberto:

| Área                       | Exemplos de casos                                                                                                                                                                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Saldos e agregações        | saldo com várias transações e transferências (sem multiplicar linhas no JOIN), somas acima do limite de `INTEGER`, resumo do mês, evolução com meses vazios e saldo acumulado, percentuais por categoria, orçamento só da categoria/mês, transferências fora de todos os totais |
| Recorrentes sem duplicação | rodar várias vezes, 10 execuções concorrentes, execução atrasada com leitura antiga, ocorrência excluída não volta, dia 31, data final, pausa, conta arquivada, índice único no banco                                                                                           |
| Parsing de CSV             | valores em formato brasileiro e internacional sem ponto flutuante, datas impossíveis, Windows-1252, preâmbulo do banco, linhas de saldo, crédito/débito, duplicatas exatas e possíveis                                                                                          |
| Isolamento entre usuários  | GET/PATCH/DELETE em todos os recursos de outro usuário retornam 404, listagens e dashboards vazios, impossível referenciar conta/categoria alheia (inclusive direto no banco, pelas chaves compostas)                                                                           |

Os testes de concorrência foram validados com mutações: removendo a trava do `last_run_date`, o
`skipDuplicates` ou o advisory lock da importação, os testes correspondentes falham.

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

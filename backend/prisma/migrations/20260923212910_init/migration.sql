-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('WALLET', 'CHECKING', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "RecurrenceFrequency" AS ENUM ('WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "type" "AccountType" NOT NULL,
    "initial_balance" INTEGER NOT NULL DEFAULT 0,
    "color" VARCHAR(7) NOT NULL DEFAULT '#64748b',
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "color" VARCHAR(7) NOT NULL,
    "icon" VARCHAR(40) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "category_id" UUID,
    "recurring_transaction_id" UUID,
    "type" "TransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_transactions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "category_id" UUID,
    "type" "TransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "notes" TEXT,
    "frequency" "RecurrenceFrequency" NOT NULL,
    "day" SMALLINT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "last_run_date" DATE,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "recurring_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "month" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "target_amount" INTEGER NOT NULL,
    "current_amount" INTEGER NOT NULL DEFAULT 0,
    "deadline" DATE,
    "color" VARCHAR(7) NOT NULL DEFAULT '#10b981',
    "icon" VARCHAR(40) NOT NULL DEFAULT 'target',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_id_user_id_key" ON "accounts"("id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_user_id_name_key" ON "accounts"("user_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_id_user_id_key" ON "categories"("id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_user_id_type_name_key" ON "categories"("user_id", "type", "name");

-- CreateIndex
CREATE INDEX "transactions_user_id_date_idx" ON "transactions"("user_id", "date" DESC);

-- CreateIndex
CREATE INDEX "transactions_user_id_type_date_idx" ON "transactions"("user_id", "type", "date");

-- CreateIndex
CREATE INDEX "transactions_user_id_account_id_idx" ON "transactions"("user_id", "account_id");

-- CreateIndex
CREATE INDEX "transactions_user_id_category_id_idx" ON "transactions"("user_id", "category_id");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_recurring_transaction_id_date_key" ON "transactions"("recurring_transaction_id", "date");

-- CreateIndex
CREATE INDEX "recurring_transactions_user_id_idx" ON "recurring_transactions"("user_id");

-- CreateIndex
CREATE INDEX "recurring_transactions_active_last_run_date_idx" ON "recurring_transactions"("active", "last_run_date");

-- CreateIndex
CREATE UNIQUE INDEX "recurring_transactions_id_user_id_key" ON "recurring_transactions"("id", "user_id");

-- CreateIndex
CREATE INDEX "budgets_user_id_month_idx" ON "budgets"("user_id", "month");

-- CreateIndex
CREATE UNIQUE INDEX "budgets_user_id_category_id_month_key" ON "budgets"("user_id", "category_id", "month");

-- CreateIndex
CREATE INDEX "goals_user_id_idx" ON "goals"("user_id");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_user_id_fkey" FOREIGN KEY ("account_id", "user_id") REFERENCES "accounts"("id", "user_id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_user_id_fkey" FOREIGN KEY ("category_id", "user_id") REFERENCES "categories"("id", "user_id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_recurring_transaction_id_fkey" FOREIGN KEY ("recurring_transaction_id") REFERENCES "recurring_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_account_id_user_id_fkey" FOREIGN KEY ("account_id", "user_id") REFERENCES "accounts"("id", "user_id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_category_id_user_id_fkey" FOREIGN KEY ("category_id", "user_id") REFERENCES "categories"("id", "user_id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_category_id_user_id_fkey" FOREIGN KEY ("category_id", "user_id") REFERENCES "categories"("id", "user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Check constraints (not expressible in the Prisma schema)
ALTER TABLE "users" ADD CONSTRAINT "users_email_lowercase_check" CHECK ("email" = lower("email"));

ALTER TABLE "accounts" ADD CONSTRAINT "accounts_color_check" CHECK ("color" ~ '^#[0-9a-fA-F]{6}$');

ALTER TABLE "categories" ADD CONSTRAINT "categories_color_check" CHECK ("color" ~ '^#[0-9a-fA-F]{6}$');

ALTER TABLE "transactions" ADD CONSTRAINT "transactions_amount_positive_check" CHECK ("amount" > 0);

ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_amount_positive_check" CHECK ("amount" > 0);
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_day_check" CHECK (
  ("frequency" = 'WEEKLY' AND "day" BETWEEN 0 AND 6)
  OR ("frequency" IN ('MONTHLY', 'YEARLY') AND "day" BETWEEN 1 AND 31)
);
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_period_check" CHECK ("end_date" IS NULL OR "end_date" >= "start_date");

ALTER TABLE "budgets" ADD CONSTRAINT "budgets_amount_positive_check" CHECK ("amount" > 0);
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_month_first_day_check" CHECK (EXTRACT(DAY FROM "month") = 1);

ALTER TABLE "goals" ADD CONSTRAINT "goals_target_amount_positive_check" CHECK ("target_amount" > 0);
ALTER TABLE "goals" ADD CONSTRAINT "goals_current_amount_non_negative_check" CHECK ("current_amount" >= 0);

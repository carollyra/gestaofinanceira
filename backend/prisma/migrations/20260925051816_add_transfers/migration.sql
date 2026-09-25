-- CreateTable
CREATE TABLE "transfers" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "from_account_id" UUID NOT NULL,
    "to_account_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transfers_user_id_date_idx" ON "transfers"("user_id", "date" DESC);

-- CreateIndex
CREATE INDEX "transfers_user_id_from_account_id_idx" ON "transfers"("user_id", "from_account_id");

-- CreateIndex
CREATE INDEX "transfers_user_id_to_account_id_idx" ON "transfers"("user_id", "to_account_id");

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_from_account_id_user_id_fkey" FOREIGN KEY ("from_account_id", "user_id") REFERENCES "accounts"("id", "user_id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_to_account_id_user_id_fkey" FOREIGN KEY ("to_account_id", "user_id") REFERENCES "accounts"("id", "user_id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- Check constraints (not expressible in the Prisma schema)
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_amount_positive_check" CHECK ("amount" > 0);
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_distinct_accounts_check" CHECK ("from_account_id" <> "to_account_id");

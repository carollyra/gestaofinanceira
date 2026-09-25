-- Trigram operator classes used by the GIN indexes below
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateIndex
CREATE INDEX "transactions_description_trgm_idx" ON "transactions" USING GIN ("description" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "transactions_notes_trgm_idx" ON "transactions" USING GIN ("notes" gin_trgm_ops);

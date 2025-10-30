-- CreateEnum
CREATE TYPE "ComputationStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- AlterTable: Add MPC and computation fields to PaymentIntent
ALTER TABLE "payment_intents"
  ADD COLUMN "encryptionNonce" BYTEA,
  ADD COLUMN "encryptionPublicKey" BYTEA,
  ADD COLUMN "clientPublicKey" BYTEA,
  ADD COLUMN "computationId" TEXT,
  ADD COLUMN "computationStatus" "ComputationStatus" DEFAULT 'QUEUED',
  ADD COLUMN "computationError" TEXT,
  ADD COLUMN "finalizedAt" TIMESTAMP(3),
  ADD COLUMN "finalizationSignature" TEXT,
  ADD COLUMN "resultCiphertext" BYTEA,
  ADD COLUMN "resultNonce" BYTEA;

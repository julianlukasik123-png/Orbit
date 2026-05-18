-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('typeform', 'sms', 'call', 'csv', 'manual');

-- CreateEnum
CREATE TYPE "LeadClassification" AS ENUM ('pending', 'high_value', 'low_value', 'invalid', 'unqualified');

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "message" TEXT,
    "source" "LeadSource" NOT NULL DEFAULT 'manual',
    "classification" "LeadClassification" NOT NULL DEFAULT 'pending',
    "classifyReason" TEXT,
    "score" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leads_tenantId_idx" ON "leads"("tenantId");

-- CreateIndex
CREATE INDEX "leads_tenantId_classification_idx" ON "leads"("tenantId", "classification");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

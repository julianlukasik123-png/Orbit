-- CreateTable
CREATE TABLE "sms_threads" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "leadId" TEXT,
    "fromPhone" TEXT NOT NULL,
    "toPhone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sms_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_messages" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "sid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sms_threads_leadId_key" ON "sms_threads"("leadId");

-- CreateIndex
CREATE INDEX "sms_threads_tenantId_idx" ON "sms_threads"("tenantId");

-- CreateIndex
CREATE INDEX "sms_threads_tenantId_fromPhone_idx" ON "sms_threads"("tenantId", "fromPhone");

-- CreateIndex
CREATE INDEX "sms_messages_threadId_idx" ON "sms_messages"("threadId");

-- AddForeignKey
ALTER TABLE "sms_threads" ADD CONSTRAINT "sms_threads_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_threads" ADD CONSTRAINT "sms_threads_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_messages" ADD CONSTRAINT "sms_messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "sms_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

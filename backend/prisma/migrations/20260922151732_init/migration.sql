-- CreateTable
CREATE TABLE "CashBill" (
    "id" TEXT NOT NULL,
    "billNumber" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientName" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'paid',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashBillItem" (
    "id" TEXT NOT NULL,
    "cashBillId" TEXT NOT NULL,
    "particulars" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "CashBillItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CashBill_billNumber_key" ON "CashBill"("billNumber");

-- CreateIndex
CREATE INDEX "CashBill_billNumber_idx" ON "CashBill"("billNumber");

-- CreateIndex
CREATE INDEX "CashBill_date_idx" ON "CashBill"("date");

-- CreateIndex
CREATE INDEX "CashBillItem_cashBillId_idx" ON "CashBillItem"("cashBillId");

-- AddForeignKey
ALTER TABLE "CashBillItem" ADD CONSTRAINT "CashBillItem_cashBillId_fkey" FOREIGN KEY ("cashBillId") REFERENCES "CashBill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

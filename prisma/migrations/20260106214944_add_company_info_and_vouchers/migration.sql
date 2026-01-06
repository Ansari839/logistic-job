-- CreateEnum
CREATE TYPE "VoucherType" AS ENUM ('PAYMENT', 'RECEIPT', 'JOURNAL');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "fiscalYearEnd" TIMESTAMP(3),
ADD COLUMN     "fiscalYearStart" TIMESTAMP(3),
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "registrationNo" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "tagline" TEXT,
ADD COLUMN     "taxNumber" TEXT,
ADD COLUMN     "website" TEXT;

-- CreateTable
CREATE TABLE "Voucher" (
    "id" SERIAL NOT NULL,
    "voucherNumber" TEXT NOT NULL,
    "voucherType" "VoucherType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "companyId" INTEGER NOT NULL,
    "division" TEXT DEFAULT 'logistics',
    "isPosted" BOOLEAN NOT NULL DEFAULT false,
    "postedAt" TIMESTAMP(3),
    "postedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoucherEntry" (
    "id" SERIAL NOT NULL,
    "voucherId" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    "debit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "credit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoucherEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Voucher_companyId_voucherNumber_key" ON "Voucher"("companyId", "voucherNumber");

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherEntry" ADD CONSTRAINT "VoucherEntry_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherEntry" ADD CONSTRAINT "VoucherEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

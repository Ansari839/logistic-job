-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "division" TEXT DEFAULT 'logistics';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "division" TEXT DEFAULT 'logistics';

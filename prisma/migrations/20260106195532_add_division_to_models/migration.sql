-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "division" TEXT DEFAULT 'logistics';

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "division" TEXT DEFAULT 'logistics';

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "division" TEXT DEFAULT 'logistics';

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "division" TEXT DEFAULT 'logistics';

-- AlterTable
ALTER TABLE "Enrollment" ALTER COLUMN "CertificateNo" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Counter" (
    "name" TEXT NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "Counter_pkey" PRIMARY KEY ("name")
);

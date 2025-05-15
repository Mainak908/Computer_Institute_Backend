-- AlterTable
ALTER TABLE "Enquiry" ADD COLUMN     "isdeleted" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "Enquiry_id_seq";

-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "isdeleted" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "EnrollmentNo" DROP DEFAULT,
ALTER COLUMN "IdCardNo" DROP DEFAULT,
ALTER COLUMN "CertificateNo" DROP DEFAULT;
DROP SEQUENCE "Enrollment_EnrollmentNo_seq";
DROP SEQUENCE "Enrollment_IdCardNo_seq";
DROP SEQUENCE "Enrollment_CertificateNo_seq";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isdeleted" BOOLEAN NOT NULL DEFAULT false;

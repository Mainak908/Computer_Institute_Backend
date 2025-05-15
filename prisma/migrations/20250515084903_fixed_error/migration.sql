-- AlterTable
ALTER TABLE "Center" ALTER COLUMN "code" DROP DEFAULT;
DROP SEQUENCE "Center_code_seq";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "User_id_seq";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CENTER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE', 'TRANSGENDER');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('SC', 'ST', 'GENERAL', 'OBC', 'PH', 'OTHERS');

-- CreateEnum
CREATE TYPE "Nationality" AS ENUM ('INDIAN', 'FOREIGNER');

-- CreateEnum
CREATE TYPE "statusType" AS ENUM ('passout', 'pending');

-- CreateEnum
CREATE TYPE "IdType" AS ENUM ('aadhaar', 'BirthCertificate', 'Admit');

-- CreateEnum
CREATE TYPE "IdType2" AS ENUM ('aadhaar', 'voter', 'drivingLicense');

-- CreateEnum
CREATE TYPE "Remark" AS ENUM ('PASS', 'FAIL');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CENTER',
    "password" TEXT NOT NULL,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "TwoFaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "TwoFaSecret" TEXT,
    "enquiryid" INTEGER,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Center" (
    "code" SERIAL NOT NULL,
    "Centername" TEXT NOT NULL,
    "adminid" INTEGER NOT NULL,
    "address" TEXT NOT NULL,

    CONSTRAINT "Center_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "EnrollmentNo" SERIAL NOT NULL,
    "IdCardNo" SERIAL NOT NULL,
    "idCardLink" TEXT NOT NULL DEFAULT 'notavl',
    "admitLink" TEXT NOT NULL DEFAULT 'notavl',
    "certificateLink" TEXT NOT NULL DEFAULT 'notavl',
    "marksheetLink" TEXT NOT NULL DEFAULT 'notavl',
    "imageLink" TEXT NOT NULL,
    "CertificateNo" SERIAL,
    "name" TEXT NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "father" TEXT NOT NULL,
    "mother" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "dist" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "ps" TEXT NOT NULL,
    "po" TEXT NOT NULL,
    "vill" TEXT NOT NULL,
    "mobileNo" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "sex" "Sex" NOT NULL,
    "category" "Category" NOT NULL,
    "nationality" "Nationality" NOT NULL,
    "idProof" "IdType" NOT NULL,
    "idProofNo" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "eduqualification" TEXT NOT NULL,
    "activated" BOOLEAN NOT NULL DEFAULT false,
    "courseId" INTEGER NOT NULL,
    "centerid" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" JSONB NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("EnrollmentNo")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" SERIAL NOT NULL,
    "CName" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "Duration" INTEGER NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" SERIAL NOT NULL,
    "SubName" TEXT NOT NULL,
    "theoryFullMarks" INTEGER NOT NULL,
    "practFullMarks" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Amount" (
    "id" SERIAL NOT NULL,
    "TotalPaid" INTEGER NOT NULL,
    "amountRemain" INTEGER NOT NULL,
    "lastPaymentRecieptno" TEXT,
    "EnrollmentNo" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Amount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamForm" (
    "id" SERIAL NOT NULL,
    "EnrollmentNo" INTEGER NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ExamCenterCode" TEXT NOT NULL,
    "ATI_CODE" TEXT NOT NULL,

    CONSTRAINT "ExamForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Marks" (
    "id" SERIAL NOT NULL,
    "marks" JSONB NOT NULL,
    "remarks" "Remark" NOT NULL,
    "EnrollmentNo" INTEGER NOT NULL,
    "grade" TEXT NOT NULL,
    "totalMarks" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "year" TEXT NOT NULL,

    CONSTRAINT "Marks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enquiry" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "father" TEXT NOT NULL,
    "coName" TEXT NOT NULL,
    "dist" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "ps" TEXT NOT NULL,
    "po" TEXT NOT NULL,
    "vill" TEXT NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "sex" "Sex" NOT NULL,
    "category" "Category" NOT NULL,
    "nationality" "Nationality" NOT NULL,
    "mobileNo" TEXT NOT NULL,
    "AddressLine" TEXT NOT NULL,
    "eduqualification" TEXT NOT NULL,
    "idProof" "IdType2" NOT NULL,
    "idProofNo" TEXT NOT NULL,
    "houseRoomNo" TEXT NOT NULL,
    "squareFit" TEXT NOT NULL,
    "tradeLicense" TEXT NOT NULL,
    "bathroom" BOOLEAN NOT NULL,
    "signatureLink" TEXT NOT NULL,
    "ImageLink" TEXT NOT NULL,
    "certificateLink" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Subscription" TIMESTAMP(3),

    CONSTRAINT "Enquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notices" (
    "id" SERIAL NOT NULL,
    "heading" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "upto" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "State" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "imgUrl" TEXT NOT NULL,

    CONSTRAINT "State_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "District" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "DistrictName" TEXT NOT NULL,
    "imgUrl" TEXT NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_enquiryid_key" ON "User"("enquiryid");

-- CreateIndex
CREATE UNIQUE INDEX "Center_code_key" ON "Center"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Center_adminid_key" ON "Center"("adminid");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_EnrollmentNo_key" ON "Enrollment"("EnrollmentNo");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_IdCardNo_key" ON "Enrollment"("IdCardNo");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_CertificateNo_key" ON "Enrollment"("CertificateNo");

-- CreateIndex
CREATE INDEX "Enrollment_EnrollmentNo_centerid_idx" ON "Enrollment"("EnrollmentNo", "centerid");

-- CreateIndex
CREATE UNIQUE INDEX "Amount_EnrollmentNo_key" ON "Amount"("EnrollmentNo");

-- CreateIndex
CREATE UNIQUE INDEX "ExamForm_EnrollmentNo_key" ON "ExamForm"("EnrollmentNo");

-- CreateIndex
CREATE UNIQUE INDEX "Marks_EnrollmentNo_key" ON "Marks"("EnrollmentNo");

-- CreateIndex
CREATE UNIQUE INDEX "Enquiry_email_key" ON "Enquiry"("email");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_enquiryid_fkey" FOREIGN KEY ("enquiryid") REFERENCES "Enquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Center" ADD CONSTRAINT "Center_adminid_fkey" FOREIGN KEY ("adminid") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_centerid_fkey" FOREIGN KEY ("centerid") REFERENCES "Center"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Amount" ADD CONSTRAINT "Amount_EnrollmentNo_fkey" FOREIGN KEY ("EnrollmentNo") REFERENCES "Enrollment"("EnrollmentNo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamForm" ADD CONSTRAINT "ExamForm_EnrollmentNo_fkey" FOREIGN KEY ("EnrollmentNo") REFERENCES "Enrollment"("EnrollmentNo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Marks" ADD CONSTRAINT "Marks_EnrollmentNo_fkey" FOREIGN KEY ("EnrollmentNo") REFERENCES "Enrollment"("EnrollmentNo") ON DELETE CASCADE ON UPDATE CASCADE;

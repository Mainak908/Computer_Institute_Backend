import { PrismaClient } from "../generate/client.js";
const prisma = new PrismaClient();

async function initCounters() {
  await prisma.counter.createMany({
    data: [
      { name: "EnrollmentNo", value: 0 },
      { name: "IdCardNo", value: 0 },
      { name: "CertificateNo", value: 0 },
      { name: "CenterCode", value: 0 },
      { name: "UserId", value: 0 },
      { name: "EnquiryId", value: 0 },
    ],
    skipDuplicates: true, // safe to re-run
  });

  console.log("✅ Counters initialized");
  await prisma.$disconnect();
}

initCounters().catch((e) => {
  console.error(e);
  prisma.$disconnect();
});

import { PutObjectCommand } from "@aws-sdk/client-s3";
import axios from "axios";
import { PDFDocument, rgb } from "pdf-lib";
import { DataItem, countDigits } from "../helper.js";
import { s3 } from "../index.js";
import logger from "../logger.js";
import fs from "fs";

export async function filladmit({
  EnrollmentNo,
  enrollment: {
    name,
    father,
    course: { CName },
    imageLink,
    center: { code },
  },
  ATI_CODE,
  ExamCenterCode,
  theoryExamdate,
  practExmdate,
  practExmtime,
  theoryExmtime,
  sem,
}: DataItem) {
  try {
    const existingPdfBytes = fs.readFileSync("files/admit.pdf");
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const response = await axios({
      url: imageLink,
      responseType: "arraybuffer", // Download as buffer
    });

    const imageBytes2 = fs.readFileSync("files/sign.png");

    const page = pdfDoc.getPages()[0];
    if (typeof page == "undefined") return;

    const pdfHeight = page.getHeight();

    const image = await pdfDoc.embedJpg(Buffer.from(response.data));
    const image2 = await pdfDoc.embedPng(imageBytes2);

    const rem = 6 - countDigits(EnrollmentNo);
    const remcode = 6 - countDigits(code);

    const paddedNumber = EnrollmentNo.toString().padStart(rem, "0");
    const paddedCode = code.toString().padStart(remcode, "0");

    page.drawText(`YCTC${paddedCode}/${paddedNumber}`, {
      x: 165,
      y: pdfHeight - 156,
      size: 13,
      color: rgb(0, 0, 0),
    });

    page.drawText(name, {
      x: 165,
      y: pdfHeight - 173,
      size: 13,
      color: rgb(0, 0, 0),
    });

    page.drawText(father, {
      x: 165,
      y: pdfHeight - 190,
      size: 13,
      color: rgb(0, 0, 0),
    });

    page.drawText(CName, {
      x: 165,
      y: pdfHeight - 207,
      size: 10,
      color: rgb(0, 0, 0),
    });

    page.drawText(ATI_CODE, {
      x: 165,
      y: pdfHeight - 224,
      size: 13,
      color: rgb(0, 0, 0),
    });

    page.drawText(ExamCenterCode, {
      x: 165,
      y: pdfHeight - 241,
      size: 13,
      color: rgb(0, 0, 0),
    });

    page.drawText(theoryExamdate, {
      x: 83,
      y: pdfHeight - 272,
      size: 8,
      color: rgb(0, 0, 0),
    });

    page.drawText(theoryExmtime, {
      x: 145,
      y: pdfHeight - 272,
      size: 8,
      color: rgb(0, 0, 0),
    });

    page.drawText(sem, {
      x: 208,
      y: pdfHeight - 272,
      size: 8,
      color: rgb(0, 0, 0),
    });

    page.drawText(practExmdate, {
      x: 83,
      y: pdfHeight - 289,
      size: 8,
      color: rgb(0, 0, 0),
    });

    page.drawText(practExmtime, {
      x: 145,
      y: pdfHeight - 289,
      size: 8,
      color: rgb(0, 0, 0),
    });

    page.drawText(sem, {
      x: 208,
      y: pdfHeight - 289,
      size: 8,
      color: rgb(0, 0, 0),
    });

    page.drawImage(image, {
      x: 391, // Adjust X position
      y: pdfHeight - 220, // Adjust Y position (PDF coordinates start from bottom-left)
      width: 90,
      height: 100,
    });

    page.drawImage(image2, {
      x: 277, // Adjust X position
      y: pdfHeight - 325, // Adjust Y position (PDF coordinates start from bottom-left)
      width: 45,
      height: 30,
    });
    const pdfBytes = await pdfDoc.save();
    const n = name.split(" ")[0];

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `admit/${n}-${sem}.pdf`,
      Body: pdfBytes,
      ContentType: "application/pdf",
    };

    const command = new PutObjectCommand(params);
    await s3.send(command);
    const pdfUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/admit/${n}-${sem}.pdf`;
    console.log(pdfUrl);
    return pdfUrl;

    // fs.writeFileSync("filled_admit.pdf", pdfBytes);
  } catch (error) {
    logger.error(error);
  }
}

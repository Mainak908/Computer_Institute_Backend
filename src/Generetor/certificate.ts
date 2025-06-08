import { PutObjectCommand } from "@aws-sdk/client-s3";
import axios from "axios";
import { PDFDocument, rgb } from "pdf-lib";
import { MarksheetData, countDigits } from "../helper.js";
import { s3 } from "../index.js";
import logger from "../logger.js";
import QRCode from "qrcode";
import fs from "fs";

export async function fillCertificate({
  grade,
  totalMarks,
  year,
  createdAt,
  enrollment: {
    name,
    CertificateNo,
    imageLink,
    father,
    course: { CName, Duration },
    center: { Centername, code },
  },
  EnrollmentNo,
}: MarksheetData) {
  try {
    const studentData = {
      Name: name,
      EnrollmentNo,
      CourseName: CName,
      Centername,
      totalMarks,
    };

    const qrText = JSON.stringify(studentData);
    const qrCodeBuffer = await QRCode.toBuffer(qrText);

    const existingPdfBytes = fs.readFileSync("files/certificate.pdf");
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const response = await axios({
      url: imageLink,
      responseType: "arraybuffer", // Download as buffer
    });
    const Image = await pdfDoc.embedJpg(Buffer.from(response.data));

    // Get the first page
    const page = pdfDoc.getPages()[0];
    if (typeof page == "undefined") return;

    const pdfHeight = page.getHeight();
    const pdfWidth = page.getWidth();

    // Embed QR Code image
    const qrImage = await pdfDoc.embedPng(qrCodeBuffer);
    const { width, height } = qrImage.scale(0.3); // Adjust QR size

    // Position QR Code (adjust x, y as needed)

    page.drawImage(qrImage, {
      x: 50, // Adjust X position
      y: pdfHeight - 220, // Adjust Y position (PDF starts from bottom-left)
      width,
      height,
    });

    // Draw the image at a specific position (x, y)
    page.drawImage(Image, {
      x: 475, // Adjust X position
      y: pdfHeight - 220, // Adjust Y position (PDF coordinates start from bottom-left)
      width,
      height,
    });
    // Set font size and position

    const fontSize = 16;

    const remc = 4 - countDigits(CertificateNo);
    const paddedNumberc = CertificateNo.toString().padStart(remc, "0");

    page.drawText(`${year}${paddedNumberc}`, {
      x: 371,
      y: pdfHeight - 32,
      size: 12,
      color: rgb(0, 0, 0),
    });
    page.drawText(name, {
      x: 231,
      y: pdfHeight - 265,
      size: fontSize,
      color: rgb(0, 0, 0),
    });

    page.drawText(father, {
      x: 248,
      y: pdfHeight - 291,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
    page.drawText(CName, {
      x: 153,
      y: pdfHeight - 341,
      size: 15,
      color: rgb(0, 0, 0),
    });

    page.drawText(`${Duration.toString()} MONTHS`, {
      x: 145,
      y: pdfHeight - 367,
      size: fontSize,
      color: rgb(0, 0, 0),
    });

    page.drawText(year, {
      x: 486,
      y: pdfHeight - 367,
      size: 15,
      color: rgb(0, 0, 0),
    });
    page.drawText(grade, {
      x: 270,
      y: pdfHeight - 392,
      size: fontSize,
      color: rgb(0, 0, 0),
    });

    const rem = 6 - countDigits(EnrollmentNo);
    const remcode = 6 - countDigits(code);

    const paddedNumber = EnrollmentNo.toString().padStart(rem, "0");
    const paddedCode = code.toString().padStart(remcode, "0");

    page.drawText(`YCTC${paddedCode}/${paddedNumber}`, {
      x: 479,
      y: pdfHeight - 392,
      size: 13,
      color: rgb(0, 0, 0),
    });

    page.drawText(Centername, {
      x: 200,
      y: pdfHeight - 417,
      size: 13,
      color: rgb(0, 0, 0),
    });

    const issueDate = new Date(createdAt).toLocaleDateString("en-GB");

    page.drawText(issueDate, {
      x: 300,
      y: pdfHeight - 445,
      size: fontSize,
      color: rgb(0, 0, 0),
    });

    // Serialize the document and write it to a file
    const pdfBytes = await pdfDoc.save();
    const n = name.split(" ")[0];

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `certificates/${n}-${totalMarks}.pdf`,
      Body: pdfBytes,
      ContentType: "application/pdf",
    };

    const command = new PutObjectCommand(params);
    await s3.send(command);
    const pdfUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/certificates/${n}-${totalMarks}.pdf`;

    return pdfUrl;

    // fs.writeFileSync("filled_certificate.pdf", pdfBytes);
  } catch (error) {
    logger.error(error);
  }
}

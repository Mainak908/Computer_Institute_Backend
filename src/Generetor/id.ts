import { PutObjectCommand } from "@aws-sdk/client-s3";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  dtype,
  makeCircularImage,
  adjustCenteredTextPosition,
  countDigits,
  wrapText,
} from "../helper.js";
import { s3 } from "../index.js";
import logger from "../logger.js";
import fs from "fs";

export async function fillId({
  EnrollmentNo,
  IdCardNo,
  address,
  imageLink,
  mobileNo,
  center: { Centername, code },
  course: { CName },
  name,
}: dtype) {
  try {
    const existingPdfBytes = fs.readFileSync("files/id.pdf");
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const page = pdfDoc.getPages()[0];
    if (typeof page == "undefined") return;

    const pdfHeight = page.getHeight();
    const pdfWidth = page.getWidth();

    await makeCircularImage(imageLink);

    const imageBytes = fs.readFileSync("circle.png");

    const sNamePosition = adjustCenteredTextPosition(
      name,
      pdfWidth,
      pdfHeight,
      940,
      font,
      80
    );
    const cNamePosition = adjustCenteredTextPosition(
      CName,
      pdfWidth,
      pdfHeight,
      1000,
      font,
      40
    );

    page.drawText(name, {
      x: sNamePosition.x,
      y: sNamePosition.y,
      size: sNamePosition.size,
      color: rgb(0, 0, 0),
    });

    page.drawText(CName, {
      x: cNamePosition.x,
      y: cNamePosition.y,
      size: cNamePosition.size,
      color: rgb(0, 1, 0),
    });

    page.drawText(`ID NO: ${IdCardNo}`, {
      x: 70,
      y: pdfHeight - 1100,
      size: 50,
      color: rgb(0, 0, 0),
    });
    const rem = 6 - countDigits(EnrollmentNo);
    const remcode = 6 - countDigits(code);

    const paddedNumber = EnrollmentNo.toString().padStart(rem, "0");
    const paddedCode = code.toString().padStart(remcode, "0");

    page.drawText(`ENROLLMENT: YCTC${paddedCode}/${paddedNumber}`, {
      x: 70,
      y: pdfHeight - 1180,
      size: 50,
      color: rgb(0, 0, 0),
    });

    page.drawText(`ADDRESS: ${address}`, {
      x: 70,
      y: pdfHeight - 1260,
      size: 50,
      color: rgb(0, 0, 0),
    });

    // Define text wrapping parameters
    const maxWidth = pdfWidth - 60; // Adjust as needed
    const fontSize = 50;
    const wrappedLines = wrapText({
      text: `CENTER: ${Centername}`,
      maxWidth,
      font,
      fontSize,
    });

    // Draw wrapped text
    let yPosition = pdfHeight - 1340;

    wrappedLines.forEach((line) => {
      page.drawText(line, {
        x: 70,
        y: yPosition,
        size: fontSize,
        color: rgb(0, 0, 0),
      });
      yPosition -= fontSize + 5; // Adjust line spacing
    });

    const Image = await pdfDoc.embedPng(imageBytes);
    const { width, height } = Image.scale(0.47); // Scale image

    page.drawImage(Image, {
      x: 340, // Adjust X position
      y: pdfHeight - 830, // Adjust Y position (PDF coordinates start from bottom-left)
      width,
      height,
    });

    page.drawText(address, {
      x: 23,
      y: pdfHeight - 1540,
      size: 45,
      color: rgb(1, 1, 1),
    });

    page.drawText(`ph: ${mobileNo}`, {
      x: 690,
      y: pdfHeight - 1656,
      size: 45,
      color: rgb(1, 1, 1),
    });

    const pdfBytes = await pdfDoc.save();
    const n = name.split(" ")[0];
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `idcard/${n}-${IdCardNo}.pdf`,
      Body: pdfBytes,
      ContentType: "application/pdf",
    };
    const command = new PutObjectCommand(params);
    await s3.send(command);
    const pdfUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/idcard/${n}-${IdCardNo}.pdf`;
    return pdfUrl;
    // fs.writeFileSync("filled_id.pdf", pdfBytes);
  } catch (error) {
    logger.error(error);
  }
}

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  dtype,
  makeCircularImage,
  adjustCenteredTextPosition,
  countDigits,
  wrappedLines,
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
      size: 40,
      color: rgb(0, 0, 0),
    });
    const rem = 6 - countDigits(EnrollmentNo);
    const remcode = 6 - countDigits(code);

    const paddedNumber = EnrollmentNo.toString().padStart(rem, "0");
    const paddedCode = code.toString().padStart(remcode, "0");

    page.drawText(`ENROLLMENT: YCTC${paddedCode}/${paddedNumber}`, {
      x: 70,
      y: pdfHeight - 1180,
      size: 40,
      color: rgb(0, 0, 0),
    });

    wrappedLines({
      text: `ADDRESS: ${address}`,
      x: 70,
      y: pdfHeight - 1260,
      maxWidth: pdfWidth - 140,
      font,
      fontSize: 40,
      page,
      lineGap: 5,
      color: rgb(0, 0, 0),
    });

    // Define text wrapping parameters
    wrappedLines({
      text: `CENTER: ${Centername}`,
      x: 70,
      y: pdfHeight - 1380,
      maxWidth: pdfWidth - 80,
      font,
      fontSize: 40,
      page,
      lineGap: 5,
      color: rgb(0, 0, 0),
    });

    const Image = await pdfDoc.embedPng(imageBytes);
    const { width, height } = Image.scale(0.47); // Scale image

    page.drawImage(Image, {
      x: 340, // Adjust X position
      y: pdfHeight - 830, // Adjust Y position (PDF coordinates start from bottom-left)
      width,
      height,
    });

    wrappedLines({
      text: address,
      x: 23,
      y: pdfHeight - 1510,
      maxWidth: pdfWidth - 360,
      font,
      fontSize: 40,
      page,
      lineGap: 5,
      color: rgb(1, 1, 1),
    });

    page.drawText(`ph: ${mobileNo}`, {
      x: 690,
      y: pdfHeight - 1656,
      size: 40,
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

    // fs.writeFileSync("filled_id.pdf", pdfBytes);
    return pdfUrl;
  } catch (error) {
    logger.error(error);
  }
}

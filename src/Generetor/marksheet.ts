import { PutObjectCommand } from "@aws-sdk/client-s3";
import axios from "axios";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { MarksheetData, countDigits, wrappedLines } from "../helper.js";
import { s3 } from "../index.js";
import logger from "../logger.js";
import QRCode from "qrcode";
import fs from "fs";

export async function fillMarksheet(data: MarksheetData) {
  try {
    const existingPdfBytes = fs.readFileSync("files/marksheet.pdf");
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const page = pdfDoc.getPages()[0];
    if (typeof page == "undefined") return;

    const pdfHeight = page.getHeight();
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold); // Embed bold font
    const NFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const response = await axios({
      url: data.enrollment.imageLink,
      responseType: "arraybuffer", // Download as buffer
    });
    const pdfWidth = page.getWidth();
    const Image = await pdfDoc.embedJpg(Buffer.from(response.data));

    const studentData = {
      Name: data.enrollment.name,
      EnrollmentNo: data.EnrollmentNo,
      CourseName: data.enrollment.course.CName,
      Centername: data.enrollment.center.Centername,
      totalMarks: data.totalMarks,
    };

    const qrText = JSON.stringify(studentData);

    const qrCodeBuffer = await QRCode.toBuffer(qrText);

    const qrImage = await pdfDoc.embedPng(qrCodeBuffer);
    const { width, height } = qrImage.scale(0.27);

    page.drawImage(qrImage, {
      x: 35, // Adjust X position
      y: pdfHeight - 180, // Adjust Y position (PDF starts from bottom-left)
      width,
      height,
    });
    page.drawImage(Image, {
      x: 525, // Adjust X position
      y: pdfHeight - 180, // Adjust Y position (PDF coordinates start from bottom-left)
      width,
      height,
    });

    const rem = 6 - countDigits(data.EnrollmentNo);
    const remcode = 6 - countDigits(data.enrollment.center.code);

    const paddedNumber = data.EnrollmentNo.toString().padStart(rem, "0");
    const paddedCode = data.enrollment.center.code
      .toString()
      .padStart(remcode, "0");

    // Student Information
    page.drawText(data.enrollment.name.toUpperCase(), {
      x: 158,
      y: pdfHeight - 218,
      size: 12,
      color: rgb(0, 0, 0),
    });
    page.drawText(`YCTC${paddedCode}/${paddedNumber}`, {
      x: 487,
      y: pdfHeight - 218,
      size: 12,
      color: rgb(0, 0, 0),
    });
    page.drawText(data.enrollment.father.toUpperCase(), {
      x: 102,
      y: pdfHeight - 243,
      size: 12,
      color: rgb(0, 0, 0),
    });
    page.drawText(data.year, {
      x: 415,
      y: pdfHeight - 243,
      size: 12,
      color: rgb(0, 0, 0),
    });

    wrappedLines({
      text: data.enrollment.course.CName,
      x: 136,
      y: pdfHeight - 262,
      maxWidth: pdfWidth - 380,
      font: NFont,
      fontSize: 12,
      page,
      lineGap: 2,
      color: rgb(0, 0, 0),
    });
    page.drawText(
      `${data.enrollment.course.Duration.toString().toUpperCase()} MONTHS`,
      {
        x: 500,
        y: pdfHeight - 269,
        size: 12,
        color: rgb(0, 0, 0),
      }
    );

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let yPosition = pdfHeight - 405;

    wrappedLines({
      text: data.enrollment.center.Centername,
      x: 130,
      y: pdfHeight - 290,
      maxWidth: pdfWidth - 355,
      font,
      fontSize: 12,
      page,
      lineGap: 3,
      color: rgb(0, 0, 0),
    });

    page.drawText(`YCTC${paddedCode}`, {
      x: 480,
      y: pdfHeight - 295,
      size: 12,
      color: rgb(0, 0, 0),
    });
    page.drawText(data.enrollment.center.address.toUpperCase(), {
      x: 146,
      y: pdfHeight - 320,
      size: 12,
      color: rgb(0, 0, 0),
    });

    page.drawText(new Date(data.enrollment.dob).toLocaleDateString("en-GB"), {
      x: 470,
      y: pdfHeight - 320,
      size: 12,
      color: rgb(0, 0, 0),
    });

    // Initialize total marks
    let totalTheoryMarks = 0;
    let totalPracticalMarks = 0;
    let totalTheoryFullMarks = 0;
    let totalPracticalFullMarks = 0;

    let sl = 1;

    // Subjects and Marks

    data.marks.forEach((subject) => {
      const tm = parseInt(subject.theoryMarks);
      const pm = parseInt(subject.practicalMarks);
      const tfm = parseInt(subject.theoryFullMarks);
      const pfm = parseInt(subject.practicalFullMarks);
      const total = tm + pm;

      totalTheoryMarks += tm;
      totalPracticalMarks += pm;
      totalTheoryFullMarks += tfm;
      totalPracticalFullMarks += pfm;

      page.drawText(sl.toString(), {
        x: 28,
        y: yPosition,
        size: 13,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      sl++;

      const lc = wrappedLines({
        text: subject.subject,
        x: 55,
        y: yPosition,
        maxWidth: pdfWidth - 405,
        font: boldFont,
        fontSize: 11,
        page,
        lineGap: 2,
        color: rgb(0, 0, 0),
      });

      page.drawText(subject.theoryFullMarks.toString(), {
        x: 290,
        y: yPosition,
        size: 13,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      page.drawText(subject.practicalFullMarks.toString(), {
        x: 355,
        y: yPosition,
        size: 13,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      page.drawText(subject.theoryMarks.toString(), {
        x: 430,
        y: yPosition,
        size: 13,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      page.drawText(subject.practicalMarks.toString(), {
        x: 495,
        y: yPosition,
        size: 13,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      page.drawText(total.toString(), {
        x: 555,
        y: yPosition,
        size: 13,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      lc == 3 ? (yPosition -= 40) : (yPosition -= 25);
    });

    page.drawText(totalTheoryFullMarks.toString(), {
      x: 290,
      y: pdfHeight - 645,
      size: 13,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText(totalPracticalFullMarks.toString(), {
      x: 355,
      y: pdfHeight - 645,
      size: 13,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText(totalTheoryMarks.toString(), {
      x: 426,
      y: pdfHeight - 645,
      size: 13,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText(totalPracticalMarks.toString(), {
      x: 490,
      y: pdfHeight - 645,
      size: 13,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Grand Total, Percentage, Grade, and Result
    page.drawText(data.totalMarks.toString(), {
      x: 555,
      y: pdfHeight - 645,
      size: 13,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    page.drawText(data.percentage.toFixed(2) + "%", {
      x: 285,
      y: pdfHeight - 672,
      size: 13,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    page.drawText(data.grade, {
      x: 560,
      y: pdfHeight - 672,
      size: 13,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    page.drawText(data.remarks, {
      x: 50,
      y: pdfHeight - 672,
      size: 13,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    const issueDate = new Date(data.createdAt).toLocaleDateString("en-GB");

    page.drawText(issueDate, {
      x: 150,
      y: pdfHeight - 700,
      size: 13,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    const n = data.enrollment.name.split(" ")[0];

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `marksheet/${n}-${data.totalMarks}.pdf`,
      Body: pdfBytes,
      ContentType: "application/pdf",
    };

    const command = new PutObjectCommand(params);
    await s3.send(command);
    const pdfUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/marksheet/${n}-${data.totalMarks}.pdf`;
    // fs.writeFileSync("filled_Marksheet.pdf", pdfBytes);

    return pdfUrl;
  } catch (error) {
    logger.error(error);
  }
}

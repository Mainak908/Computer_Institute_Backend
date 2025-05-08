import { CookieOptions, Response } from "express";
import jwt from "jsonwebtoken";
import fs from "fs";
import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from "pdf-lib";
import QRCode from "qrcode";
import sharp from "sharp";
import axios from "axios";
import path from "path";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import { s3 } from "./index.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import logger from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const algorithm = "aes-256-gcm";
const key = process.env.TWOFA_ENCRYPTION_KEY!; // 32 bytes
const iv = crypto.randomBytes(16);

export function encryptSecret(secret: string) {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(secret, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();
  return { encrypted, iv: iv.toString("hex"), tag: tag.toString("hex") };
}

export function decryptSecret(encrypted: string, iv: string, tag: string) {
  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(iv, "hex")
  );
  decipher.setAuthTag(Buffer.from(tag, "hex"));
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export interface dtype {
  name: string;
  center: {
    Centername: string;
    code: number;
  };
  address: string;
  course: {
    CName: string;
  };
  EnrollmentNo: number;
  IdCardNo: number;
  imageLink: string;
  mobileNo: string;
}

export type DataItem = {
  id: number;
  EnrollmentNo: number;
  verified: boolean;
  createdAt: string;
  ExamCenterCode: string;
  ATI_CODE: string;

  practExmdate: string;
  theoryExamdate: string;
  practExmtime: string;
  theoryExmtime: string;
  sem: string;
  enrollment: {
    name: string;
    mobileNo: string;
    email: string;
    EnrollmentNo: number;
    imageLink: string;
    address: string;
    center: {
      Centername: string;
      code: number;
    };
    centerid: number;
    father: string;
    IdCardNo: string;
    amount: {
      lastPaymentRecieptno: string;
    };
    course: {
      CName: string;
    };
  };
};
export type MarksheetData = {
  enrollment: {
    name: string;
    father: string;
    dob: string;
    imageLink: string;
    CertificateNo: number;
    center: {
      Centername: string;
      code: number;
      address: string;
    };
    course: {
      CName: string;
      Duration: number;
    };
  };
  marks: {
    subject: string;
    theoryMarks: string;
    practicalMarks: string;
    theoryFullMarks: string;
    practicalFullMarks: string;
  }[];
  year: string;
  percentage: number;
  grade: string;
  EnrollmentNo: number;
  remarks: string;
  totalMarks: number;
  createdAt: string;
};

export interface FranchiseData {
  name: string;
  father: string;
  vill: string;
  createdAt: string | Date;
  email: string;
  AddressLine: string;
  id: number;
  ImageLink: string;
}

const RADIUS = 470;
export async function makeCircularImage(imageLink: string) {
  try {
    const tempPath = path.join(__dirname, "..", "tempid.jpg");
    const outputPath = path.join(__dirname, "..", "circle.png");

    // Download image
    const response = await axios({
      url: imageLink,
      responseType: "arraybuffer", // Download as buffer
    });

    fs.writeFileSync(tempPath, Buffer.from(response.data));

    // Create a circular mask with a fixed size
    const circleMask = Buffer.from(`
      <svg width="${RADIUS * 2}" height="${RADIUS * 2}">
        <circle cx="${RADIUS}" cy="${RADIUS}" r="${RADIUS}" fill="white"/>
      </svg>
    `);

    // Apply the circular mask with a fixed radius
    await sharp(tempPath)
      .resize(RADIUS * 2, RADIUS * 2) // Resize to fixed size
      .composite([{ input: circleMask, blend: "dest-in" }]) // Apply mask
      .png() // Output as PNG to keep transparency
      .toFile(outputPath);
  } catch (error) {
    logger.error(error);
  }
}

export const formatDateForJS = (date: string) => {
  const formatted = date.replace(/(\d{2})(\d{2})(\d{4})/, "$3-$2-$1"); // Convert "DDMMYYYY" to "YYYY-MM-DD"
  return new Date(formatted);
};

export function countDigits(num: number) {
  return Math.abs(num).toString().length;
}
export function generateSecurePassword(length = 12) {
  return crypto
    .randomBytes(length)
    .toString("base64") // Convert to a readable format
    .slice(0, length) // Trim to desired length
    .replace(/[^a-zA-Z0-9]/g, ""); // Remove special characters
}

export const accessTokenCookieOptions: CookieOptions = {
  maxAge: 1000 * 60 * 20 * 3 * 12,
  httpOnly: true,
  sameSite: "none",
  secure: true,
  signed: true,
};

export const Cookiehelper = (res: Response, user: any) => {
  const { password: m, ...userWithoutPassword } = user;
  const token = jwt.sign(userWithoutPassword, process.env.TOKEN_SECRET!, {
    expiresIn: "12h",
  });
  res
    .cookie("accessToken", token, accessTokenCookieOptions)
    .status(200)
    .json({ message: "Login successful", user: userWithoutPassword });
};

export const adjustCenteredTextPosition = (
  text: string,
  pdfWidth: number,
  pdfHeight: number,
  yOffset: number, // Distance from the top
  font: PDFFont, // Font object to measure text width accurately
  baseFontSize: number = 80
) => {
  let fontSize = baseFontSize;
  const textWidth = font.widthOfTextAtSize(text, fontSize); // Get accurate text width

  // Calculate X position to center the text
  const x = (pdfWidth - textWidth) / 2;

  // Adjust Y position based on the given offset (distance from the top)
  const y = pdfHeight - yOffset;

  return { x, y, size: fontSize };
};

export async function fill_franchise({
  name,
  father,
  vill,
  createdAt,
  email,
  AddressLine,
  id,
  ImageLink,
}: FranchiseData) {
  try {
    if (
      !name ||
      !father ||
      !email ||
      !vill ||
      !createdAt ||
      !ImageLink ||
      !id
    ) {
      throw new Error("Missing required franchise data");
    }

    const studentData = {
      Name: name,
      email,
      father,
    };
    const qrText = JSON.stringify(studentData);
    const qrCodeBuffer = await QRCode.toBuffer(qrText);

    const existingPdfBytes = fs.readFileSync("files/franchise.pdf");
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const qrImage = await pdfDoc.embedPng(qrCodeBuffer);
    const { width, height } = qrImage.scale(0.55);

    // Get the first page
    const page = pdfDoc.getPages()[0];
    if (typeof page == "undefined") return;

    const pdfWidth = page.getWidth();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pdfHeight = page.getHeight();

    const response = await axios({
      url: ImageLink,
      responseType: "arraybuffer", // Download as buffer
    });

    const Image = await pdfDoc.embedJpg(Buffer.from(response.data));

    const adjustedName = adjustCenteredTextPosition(
      name,
      pdfWidth,
      pdfHeight,
      pdfHeight - 286,
      font,
      17
    );

    const adjustedFather = adjustCenteredTextPosition(
      father,
      pdfWidth,
      pdfHeight,
      pdfHeight - 312,
      font,
      17
    );

    const adjustedBranchName = adjustCenteredTextPosition(
      `${vill} NATIONAL YOUTH COMPUTER CENTER`,
      pdfWidth,
      pdfHeight,
      pdfHeight - 362,
      font,
      17
    );

    const adjustedUsername = adjustCenteredTextPosition(
      `${email}`,
      pdfWidth,
      pdfHeight,
      pdfHeight - 362,
      font,
      17
    );

    const adjustedAddress = adjustCenteredTextPosition(
      AddressLine,
      pdfWidth,
      pdfHeight,
      pdfHeight - 436,
      font,
      17
    );

    page.drawImage(qrImage, {
      x: 40,
      y: pdfHeight - 263,
      width,
      height,
    });

    page.drawImage(Image, {
      x: pdfWidth - 116,
      y: pdfHeight - 268,
      width: width - 10,
      height,
    });

    page.drawText(id.toString(), {
      x: 403,
      y: pdfHeight - 66,
      size: 14,
      color: rgb(0, 0, 0),
    });

    page.drawText(name, {
      x: adjustedName.x,
      y: pdfHeight - 286,
      size: adjustedName.size,
      color: rgb(0, 0, 0),
    });

    page.drawText(father, {
      x: adjustedFather.x + 70,
      y: pdfHeight - 312,
      size: adjustedFather.size,
      color: rgb(0, 0, 0),
    });

    page.drawText(`${vill} NATIONAL YOUTH COMPUTER CENTER`, {
      x: adjustedBranchName.x,
      y: pdfHeight - 362,
      size: adjustedBranchName.size,
      color: rgb(0, 0, 0),
    });

    page.drawText("5 Years", {
      x: 170,
      y: pdfHeight - 387,
      size: 17,
      color: rgb(0, 0, 0),
    });

    page.drawText(new Date(createdAt).getFullYear().toString(), {
      x: 484,
      y: pdfHeight - 387,
      size: 17,
      color: rgb(0, 0, 0),
    });

    page.drawText(email.split("@gmail.com")[0] as string, {
      x: adjustedUsername.x - 30,
      y: pdfHeight - 413,
      size: 17,
      color: rgb(0, 0, 0),
    });

    const remc = 6 - countDigits(id);
    const paddedNumberc = id.toString().padStart(remc, "0");

    page.drawText(`YCTC${paddedNumberc}`, {
      x: 465,
      y: pdfHeight - 413,
      size: 17,
      color: rgb(0, 0, 0),
    });

    page.drawText(AddressLine, {
      x: adjustedAddress.x + 70,
      y: pdfHeight - 435,
      size: adjustedAddress.size,
      color: rgb(0, 0, 0),
    });

    page.drawText(new Date(createdAt).toLocaleDateString("en-GB"), {
      x: 323,
      y: pdfHeight - 462,
      size: 17,
      color: rgb(0, 0, 0),
    });

    const pdfBytes = await pdfDoc.save();

    // fs.writeFileSync("filled_franchise.pdf", pdfBytes);

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `franchise/${id}.pdf`,
      Body: pdfBytes,
      ContentType: "application/pdf",
    };

    const command = new PutObjectCommand(params);
    await s3.send(command);
    const pdfUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/franchise/${id}.pdf`;
    return pdfUrl;
  } catch (error) {
    logger.error(error);
    throw new Error("Failed to generate and upload franchise PDF");
  }
}

export function wrapText(
  text: string,
  maxWidth: number,
  font: PDFFont,
  fontSize: number
): string[] {
  if (!text.trim()) return [];

  const words = text.trim().split(/\s+/); // Normalize spaces
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word; // Start a new line
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}
export function wrappedLines({
  text,
  x,
  y,
  maxWidth,
  font,
  fontSize,
  page,
  lineGap = 5,
  color = rgb(0, 0, 0),
}: {
  text: string;
  x: number;
  y: number;
  maxWidth: number;
  font: PDFFont;
  fontSize: number;
  page: PDFPage;
  lineGap?: number;
  color?: ReturnType<typeof rgb>;
}) {
  const lines = wrapText(text, maxWidth, font, fontSize);

  for (const line of lines) {
    page.drawText(line, { x, y, size: fontSize, font, color });
    y -= fontSize + lineGap;
  }
}

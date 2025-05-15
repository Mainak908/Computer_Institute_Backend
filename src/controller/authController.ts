import { Request, Response } from "express";
import { prisma } from "../client.js";
import Bcrypt from "bcryptjs";
import {
  accessTokenCookieOptions,
  Cookiehelper,
  formatDateForJS,
  getNextId,
} from "../helper.js";
import jwt from "jsonwebtoken";
import { z } from "zod";
import logger from "../logger.js";
import { authenticator } from "otplib";
import qrcode from "qrcode";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const StudentloginSchema = z.object({
  EnrollmentNo: z.number().min(1, "Invalid enrollment"),
  password: z.string().min(1, "Password must be at least 1 characters"),
});

const signupSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function loginFunc(req: Request, res: Response) {
  try {
    const isvalidated = loginSchema.safeParse(req.body);

    if (!isvalidated.success) {
      res.status(400).json({ message: "failed to parse" });
      return;
    }

    const { email, password } = isvalidated.data;

    const user = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (!user) {
      res.status(200).json({ message: "User not found" });
      return;
    }
    // Compare passwords
    const isPasswordValid = await Bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(200).json({ message: "Invalid credentials" });
      return;
    }
    if (user.TwoFaEnabled) {
      res.status(200).json({ message: "enabled" });
      return;
    }
    Cookiehelper(res, user);
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
}

export async function signupFunc(req: Request, res: Response) {
  try {
    const isvalidated = signupSchema.safeParse(req.body);

    if (!isvalidated.success) {
      res.status(400).json({ message: "failed to parse" });
      return;
    }

    const { name, email, password } = isvalidated.data;
    // check if user is already exists
    const user = await prisma.user.findFirst({
      where: {
        email,
      },
    });
    if (user) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    // Hash the password
    const hashedPassword = await Bcrypt.hash(password, 10);
    await prisma.$transaction(async (tx) => {
      const userId = await getNextId(tx, "UserId");
      await prisma.user.create({
        data: {
          id: userId,
          email,
          password: hashedPassword,
          name,
        },
      });
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(400).json({ message: "User registration failed", error });
  }
}

export async function loginCheckFunc(req: Request, res: Response) {
  try {
    const { accessToken } = req.signedCookies;

    if (!accessToken) {
      res.json({ loggedIn: false });
      return;
    }
    const user = jwt.verify(
      accessToken,
      process.env.TOKEN_SECRET!
    ) as jwt.JwtPayload & { eno?: string };

    if (user.eno) {
      const data = await prisma.enrollment.findFirst({
        where: {
          EnrollmentNo: parseInt(user.eno),
        },
      });

      res.json({ loggedIn: true, user: data });
      return;
    }

    res.json({ loggedIn: true, user });
  } catch (err) {
    res.json({ loggedIn: false }).status(401);
  }
}

export async function logoutfunc(req: Request, res: Response) {
  res
    .clearCookie("accessToken", {
      ...accessTokenCookieOptions,
      maxAge: 0,
    })

    .json({ success: true });
}

export async function studentLogin(req: Request, res: Response) {
  const isvalidated = StudentloginSchema.safeParse(req.body);
  logger.error(isvalidated.error);
  if (!isvalidated.success) {
    res.status(400).json({ message: "failed to parse" });
    return;
  }

  const { EnrollmentNo, password } = isvalidated.data;

  const dob = formatDateForJS(password);

  const data = await prisma.enrollment.findFirst({
    where: {
      EnrollmentNo,
      dob,
    },
  });

  if (!data) {
    res.json({ success: false });
    return;
  }

  const token = jwt.sign({ eno: EnrollmentNo }, process.env.TOKEN_SECRET!, {
    expiresIn: "1h",
  });
  res
    .cookie("accessToken", token, accessTokenCookieOptions)
    .status(200)
    .json({ success: true, data });
}

export async function generateSecret(req: Request, res: Response) {
  const secret = authenticator.generateSecret();

  const email = req.email as string;

  const otpauth = authenticator.keyuri(email, "MNYCTC", secret);

  await prisma.user.update({
    where: {
      email,
    },
    data: {
      TwoFaSecret: secret,
    },
  });

  const imageUrl = await qrcode.toDataURL(otpauth); //base64-encoded data URL type = base64
  res.json(imageUrl);
}

export async function otpVerify(req: Request, res: Response) {
  const { otp } = req.body;
  const email = req.email;

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user || !user.TwoFaSecret) {
    res.json({ success: false });
    return;
  }

  const isValid = authenticator.verify({
    secret: user.TwoFaSecret,
    token: otp,
  });

  if (!isValid) {
    res.json({ success: isValid });
    return;
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      TwoFaEnabled: true,
    },
  });

  res.json({ success: isValid });
}

export async function otpInput(req: Request, res: Response) {
  const { otp, email } = req.body;

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user || !user.TwoFaSecret) {
    res.json({ success: false });
    return;
  }

  const isValid = authenticator.verify({
    secret: user.TwoFaSecret,
    token: otp,
  });

  if (isValid) {
    Cookiehelper(res, user);
    return;
  }

  res.json({ message: "failed" });
}


import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
import {
  createToken,
  getAuthCookieName,
  getAuthCookieOptions,
  getClearCookieOptions
} from "../utils/auth.js";

function setAuthCookie(res: Response, userId: string): void {
  res.cookie(
    getAuthCookieName(),
    createToken(userId),
    getAuthCookieOptions()
  );
}

function publicUser(user: {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt
  };
}

export async function register(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const name =
      typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    const password =
      typeof req.body?.password === "string" ? req.body.password : "";

    if (name.length < 2 || name.length > 60) {
      res.status(400).json({
        success: false,
        message: "نام باید بین ۲ تا ۶۰ کاراکتر باشد."
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      res.status(400).json({
        success: false,
        message: "آدرس ایمیل معتبر نیست."
      });
      return;
    }

    if (password.length < 8 || password.length > 72) {
      res.status(400).json({
        success: false,
        message: "رمز عبور باید بین ۸ تا ۷۲ کاراکتر باشد."
      });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "این ایمیل قبلاً ثبت شده است."
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });

    setAuthCookie(res, user.id);

    res.status(201).json({
      success: true,
      message: "حساب کاربری با موفقیت ساخته شد.",
      user: publicUser(user)
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      res.status(409).json({
        success: false,
        message: "این ایمیل قبلاً ثبت شده است."
      });
      return;
    }

    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "خطای داخلی سرور هنگام ثبت‌نام."
    });
  }
}

export async function login(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    const password =
      typeof req.body?.password === "string" ? req.body.password : "";

    if (!email || !password || password.length > 72) {
      res.status(400).json({
        success: false,
        message: "ایمیل و رمز عبور معتبر وارد کنید."
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({
        success: false,
        message: "ایمیل یا رمز عبور اشتباه است."
      });
      return;
    }

    setAuthCookie(res, user.id);

    res.status(200).json({
      success: true,
      message: "ورود با موفقیت انجام شد.",
      user: publicUser(user)
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "خطای داخلی سرور هنگام ورود."
    });
  }
}

export async function logout(
  _req: Request,
  res: Response
): Promise<void> {
  res.clearCookie(getAuthCookieName(), getClearCookieOptions());

  res.status(200).json({
    success: true,
    message: "با موفقیت از حساب خارج شدید."
  });
}

export async function me(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = res.locals.userId as string | undefined;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "وارد حساب کاربری نشده‌اید."
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });

    if (!user) {
      res.clearCookie(getAuthCookieName(), getClearCookieOptions());
      res.status(401).json({
        success: false,
        message: "حساب کاربری پیدا نشد."
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: publicUser(user)
    });
  } catch (error) {
    console.error("Current user error:", error);
    res.status(500).json({
      success: false,
      message: "خطای داخلی سرور."
    });
  }
}

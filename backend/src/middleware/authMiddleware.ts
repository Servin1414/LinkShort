
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const COOKIE_NAME = "linkshort_token";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 64) {
    throw new Error(
      "JWT_SECRET is missing or too short in backend/.env"
    );
  }

  return secret;
}

export function requireAuth(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = _req.cookies?.[COOKIE_NAME] as string | undefined;

  if (!token) {
    res.status(401).json({
      success: false,
      message: "برای ادامه باید وارد حساب کاربری شوید."
    });
    return;
  }

  try {
    const payload = jwt.verify(token, getJwtSecret(), {
      issuer: "linkshort",
      audience: "linkshort-local-app"
    });

    if (
      typeof payload === "string" ||
      typeof payload.userId !== "string" ||
      !payload.userId
    ) {
      res.status(401).json({
        success: false,
        message: "توکن ورود معتبر نیست."
      });
      return;
    }

    res.locals.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "نشست شما منقضی یا نامعتبر است. دوباره وارد شوید."
    });
  }
}

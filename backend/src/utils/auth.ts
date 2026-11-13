
import jwt from "jsonwebtoken";
import type { CookieOptions } from "express";

const COOKIE_NAME = "linkshort_token";
const TOKEN_LIFETIME = 7 * 24 * 60 * 60 * 1000;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 64) {
    throw new Error("JWT_SECRET must contain at least 64 characters.");
  }

  return secret;
}

export function createToken(userId: string): string {
  return jwt.sign({ userId }, getJwtSecret(), {
    expiresIn: "7d",
    issuer: "linkshort",
    audience: "linkshort-local-app"
  });
}

export function getAuthCookieName(): string {
  return COOKIE_NAME;
}

export function getAuthCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_LIFETIME
  };
}

export function getClearCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/"
  };
}

import type { Request, Response } from "express";
import { randomBytes } from "node:crypto";
import prisma from "../config/prisma.js";

const BASE_URL = "http://127.0.0.1:3000";

function isValidHttpUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function createCode(): string {
  return randomBytes(6).toString("base64url");
}

function getParamId(req: Request): string | null {
  const id = req.params.id;

  if (
    typeof id !== "string" ||
    id.length === 0 ||
    id.length > 128
  ) {
    return null;
  }

  return id;
}

export async function createLink(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = res.locals.userId as string;
  const { originalUrl } = req.body as {
    originalUrl?: unknown;
  };

  if (!isValidHttpUrl(originalUrl)) {
    res.status(400).json({
      success: false,
      message: "Please enter a valid HTTP or HTTPS URL.",
    });
    return;
  }

  try {
    let code = "";
    let created = false;

    for (let attempt = 0; attempt < 5; attempt++) {
      code = createCode();

      const existing = await prisma.link.findUnique({
        where: { code },
        select: { id: true },
      });

      if (!existing) {
        created = true;
        break;
      }
    }

    if (!created) {
      res.status(500).json({
        success: false,
        message:
          "Could not generate a unique short code. Please try again.",
      });
      return;
    }

    const link = await prisma.link.create({
      data: {
        userId,
        originalUrl,
        code,
      },
      select: {
        id: true,
        originalUrl: true,
        code: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Short link created successfully.",
      link: {
        ...link,
        shortUrl: `${BASE_URL}/${link.code}`,
        clicks: 0,
      },
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "An error occurred while creating the short link.",
    });
  }
}

export async function getLinks(
  _req: Request,
  res: Response,
): Promise<void> {
  const userId = res.locals.userId as string;

  try {
    const links = await prisma.link.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { clicks: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      links: links.map(({ _count, ...link }) => ({
        ...link,
        shortUrl: `${BASE_URL}/${link.code}`,
        clicks: _count.clicks,
      })),
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving your links.",
    });
  }
}

export async function updateLink(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = res.locals.userId as string;
  const id = getParamId(req);
  const { originalUrl } = req.body as {
    originalUrl?: unknown;
  };

  if (!id) {
    res.status(400).json({
      success: false,
      message: "Invalid link ID.",
    });
    return;
  }

  if (!isValidHttpUrl(originalUrl)) {
    res.status(400).json({
      success: false,
      message: "Please enter a valid HTTP or HTTPS URL.",
    });
    return;
  }

  try {
    const existing = await prisma.link.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: "Link not found.",
      });
      return;
    }

    const link = await prisma.link.update({
      where: {
        id: existing.id,
      },
      data: {
        originalUrl,
      },
      select: {
        id: true,
        originalUrl: true,
        code: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Link updated successfully.",
      link: {
        ...link,
        shortUrl: `${BASE_URL}/${link.code}`,
      },
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the link.",
    });
  }
}

export async function toggleLinkStatus(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = res.locals.userId as string;
  const id = getParamId(req);
  const { isActive } = req.body as {
    isActive?: unknown;
  };

  if (!id) {
    res.status(400).json({
      success: false,
      message: "Invalid link ID.",
    });
    return;
  }

  if (typeof isActive !== "boolean") {
    res.status(400).json({
      success: false,
      message: "isActive must be true or false.",
    });
    return;
  }

  try {
    const existing = await prisma.link.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: "Link not found.",
      });
      return;
    }

    const link = await prisma.link.update({
      where: {
        id: existing.id,
      },
      data: {
        isActive,
      },
      select: {
        id: true,
        originalUrl: true,
        code: true,
        isActive: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: isActive
        ? "Link activated successfully."
        : "Link deactivated successfully.",
      link: {
        ...link,
        shortUrl: `${BASE_URL}/${link.code}`,
      },
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "An error occurred while changing link status.",
    });
  }
}

export async function deleteLink(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = res.locals.userId as string;
  const id = getParamId(req);

  if (!id) {
    res.status(400).json({
      success: false,
      message: "Invalid link ID.",
    });
    return;
  }

  try {
    const existing = await prisma.link.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: "Link not found.",
      });
      return;
    }

    await prisma.link.delete({
      where: {
        id: existing.id,
      },
    });

    res.status(200).json({
      success: true,
      message: "Link deleted successfully.",
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "An error occurred while deleting the link.",
    });
  }
}

export async function redirectLink(
  req: Request,
  res: Response,
): Promise<void> {
  const code = req.params.code;

  if (
    typeof code !== "string" ||
    !/^[A-Za-z0-9_-]{1,32}$/.test(code)
  ) {
    res.status(404).send("Short link not found.");
    return;
  }

  try {
    const link = await prisma.link.findUnique({
      where: { code },
      select: {
        id: true,
        originalUrl: true,
        isActive: true,
      },
    });

    if (!link) {
      res.status(404).send("Short link not found.");
      return;
    }

    if (!link.isActive) {
      res.status(410).send("This short link has been deactivated.");
      return;
    }

    await prisma.click.create({
      data: {
        linkId: link.id,
      },
    });

    res.redirect(302, link.originalUrl);
  } catch {
    res.status(500).send("An error occurred while redirecting.");
  }
}

export async function getAnalytics(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = res.locals.userId as string;
  const rawDays = req.query.days;

  const days: 7 | 30 = rawDays === "30" ? 30 : 7;

  try {
    const now = new Date();

    const end = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
      ),
    );

    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - days);

    const clicks = await prisma.click.findMany({
      where: {
        clickedAt: {
          gte: start,
          lt: end,
        },
        link: {
          userId,
        },
      },
      select: {
        clickedAt: true,
      },
      orderBy: {
        clickedAt: "asc",
      },
    });

    const dailyCounts = new Map<string, number>();

    for (let i = 0; i < days; i++) {
      const date = new Date(start);
      date.setUTCDate(date.getUTCDate() + i);

      dailyCounts.set(date.toISOString().slice(0, 10), 0);
    }

    for (const click of clicks) {
      const date = click.clickedAt.toISOString().slice(0, 10);

      if (dailyCounts.has(date)) {
        dailyCounts.set(
          date,
          (dailyCounts.get(date) ?? 0) + 1,
        );
      }
    }

    const daily = Array.from(
      dailyCounts,
      ([date, count]) => ({
        date,
        clicks: count,
      }),
    );

    res.status(200).json({
      success: true,
      days,
      totalClicks: clicks.length,
      daily,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to load analytics.",
    });
  }
}


import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import linkRoutes from "./routes/linkRoutes.js";
import { redirectLink } from "./controllers/linkController.js";

const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: [
      "http://127.0.0.1:5173",
      "http://localhost:5173"
    ],
    credentials: true
  })
);

app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "LinkShort API is running",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/links", linkRoutes);

// این مسیر باید بعد از مسیرهای API قرار بگیرد.
app.get("/:code", redirectLink);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "مسیر موردنظر پیدا نشد."
  });
});

export default app;

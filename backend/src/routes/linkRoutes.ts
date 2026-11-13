import { Router } from "express";

import {
  createLink,
  getLinks,
  getAnalytics,
  updateLink,
  toggleLinkStatus,
  deleteLink,
} from "../controllers/linkController.js";

import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);

router.get("/analytics", getAnalytics);

router.post("/", createLink);
router.get("/", getLinks);

router.patch("/:id", updateLink);
router.patch("/:id/status", toggleLinkStatus);
router.delete("/:id", deleteLink);

export default router;

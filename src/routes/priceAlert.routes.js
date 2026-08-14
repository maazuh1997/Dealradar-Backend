import express from "express";
import {
    createPriceAlert,
    getPriceAlerts,
    updatePriceAlert,
    deletePriceAlert
} from "../controllers/priceAlert.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createPriceAlert);
router.get("/", getPriceAlerts);
router.put("/:id", updatePriceAlert);
router.delete("/:id", deletePriceAlert);

export default router;
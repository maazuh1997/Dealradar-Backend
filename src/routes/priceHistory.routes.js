import express from "express";
import {
    getProductPriceHistory,
    getProductPriceStats
} from "../controllers/priceHistory.controller.js";

const router = express.Router();

router.get(
    "/product/:productId",
    getProductPriceHistory
);

router.get(
    "/product/:productId/stats",
    getProductPriceStats
);

export default router;
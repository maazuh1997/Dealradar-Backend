import express from "express";
import {
    getProductPriceHistory,
    getProductPriceStats,
    getVariantPriceHistory,
    getVariantPriceStats
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

router.get(
    "/variant/:variantId",
    getVariantPriceHistory
);

router.get(
    "/variant/:variantId/stats",
    getVariantPriceStats
);

export default router;
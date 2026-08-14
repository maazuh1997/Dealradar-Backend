import express from "express";
import {
    listProviders,
    searchProductsFromProvider,
    ingestProviderOffers,
    refreshProviderPrices
} from "../controllers/provider.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import adminMiddleware from "../middleware/admin.middleware.js";

const router = express.Router();

router.get("/", listProviders);
router.get("/search", searchProductsFromProvider);

router.post(
    "/ingest",
    authMiddleware,
    adminMiddleware,
    ingestProviderOffers
);

router.post(
    "/refresh",
    authMiddleware,
    adminMiddleware,
    refreshProviderPrices
);

export default router;
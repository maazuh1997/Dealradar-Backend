import express from "express";
import {
    createOffer,
    getOffersByProduct,
    getOfferById,
    updateOffer,
    deleteOffer
} from "../controllers/offer.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import adminMiddleware from "../middleware/admin.middleware.js";

const router = express.Router();

router.get("/product/:productId", getOffersByProduct);
router.get("/:id", getOfferById);

router.post(
    "/",
    authMiddleware,
    adminMiddleware,
    createOffer
);

router.put(
    "/:id",
    authMiddleware,
    adminMiddleware,
    updateOffer
);

router.delete(
    "/:id",
    authMiddleware,
    adminMiddleware,
    deleteOffer
);

export default router;
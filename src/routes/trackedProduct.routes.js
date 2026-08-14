import express from "express";
import {
    createTrackedProduct
} from "../controllers/trackedProduct.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post(
    "/",
    createTrackedProduct
);

export default router;
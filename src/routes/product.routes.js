import express from "express";
import {
    createProduct,
    getProducts,
    searchProducts,
    getProductBySlug,
    updateProduct,
    deleteProduct
} from "../controllers/product.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import adminMiddleware from "../middleware/admin.middleware.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/search", searchProducts);
router.get("/:slug", getProductBySlug);

router.post("/", authMiddleware, adminMiddleware, createProduct);
router.put("/:id", authMiddleware, adminMiddleware, updateProduct);
router.delete("/:id", authMiddleware, adminMiddleware, deleteProduct);

export default router;
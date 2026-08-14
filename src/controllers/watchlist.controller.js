import Watchlist from "../models/Watchlist.js";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";

const addToWatchlist = asyncHandler(async (req, res) => {
    const { productId } = req.body;

    if (!productId) {
        return res.status(400).json({
            success: false,
            message: "Product ID is required"
        });
    }

    const product = await Product.findById(productId);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }

    const existingItem = await Watchlist.findOne({
        user: req.user._id,
        product: productId
    });

    if (existingItem) {
        return res.status(409).json({
            success: false,
            message: "Product is already in your watchlist"
        });
    }

    const item = await Watchlist.create({
        user: req.user._id,
        product: productId
    });

    const populatedItem = await item.populate("product");

    res.status(201).json({
        success: true,
        message: "Product added to watchlist",
        data: {
            item: populatedItem
        }
    });
});

const getWatchlist = asyncHandler(async (req, res) => {
    const items = await Watchlist.find({
        user: req.user._id
    })
        .populate("product")
        .sort({
            createdAt: -1
        });

    res.status(200).json({
        success: true,
        data: {
            items
        }
    });
});

const removeFromWatchlist = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const item = await Watchlist.findOne({
        user: req.user._id,
        product: productId
    });

    if (!item) {
        return res.status(404).json({
            success: false,
            message: "Product is not in your watchlist"
        });
    }

    await item.deleteOne();

    res.status(200).json({
        success: true,
        message: "Product removed from watchlist"
    });
});

export {
    addToWatchlist,
    getWatchlist,
    removeFromWatchlist
};
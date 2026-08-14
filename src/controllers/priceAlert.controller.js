import PriceAlert from "../models/PriceAlert.js";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";

const createPriceAlert = asyncHandler(async (req, res) => {
    const {
        productId,
        targetPrice,
        currency
    } = req.body;

    if (!productId || targetPrice === undefined) {
        return res.status(400).json({
            success: false,
            message: "Product ID and target price are required"
        });
    }

    if (targetPrice <= 0) {
        return res.status(400).json({
            success: false,
            message: "Target price must be greater than zero"
        });
    }

    const product = await Product.findById(productId);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }

    const existingAlert = await PriceAlert.findOne({
        user: req.user._id,
        product: productId,
        isActive: true
    });

    if (existingAlert) {
        existingAlert.targetPrice = targetPrice;

        if (currency) {
            existingAlert.currency = currency;
        }

        await existingAlert.save();

        return res.status(200).json({
            success: true,
            message: "Price alert updated",
            data: {
                alert: existingAlert
            }
        });
    }

    const alert = await PriceAlert.create({
        user: req.user._id,
        product: productId,
        targetPrice,
        currency: currency || "USD"
    });

    const populatedAlert = await alert.populate(
        "product"
    );

    res.status(201).json({
        success: true,
        message: "Price alert created",
        data: {
            alert: populatedAlert
        }
    });
});

const getPriceAlerts = asyncHandler(async (req, res) => {
    const alerts = await PriceAlert.find({
        user: req.user._id
    })
        .populate("product")
        .sort({
            createdAt: -1
        });

    res.status(200).json({
        success: true,
        data: {
            alerts
        }
    });
});

const updatePriceAlert = asyncHandler(async (req, res) => {
    const alert = await PriceAlert.findOne({
        _id: req.params.id,
        user: req.user._id
    });

    if (!alert) {
        return res.status(404).json({
            success: false,
            message: "Price alert not found"
        });
    }

    const {
        targetPrice,
        isActive
    } = req.body;

    if (
        targetPrice !== undefined &&
        targetPrice <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Target price must be greater than zero"
        });
    }

    if (targetPrice !== undefined) {
        alert.targetPrice = targetPrice;
    }

    if (isActive !== undefined) {
        alert.isActive = isActive;
    }

    await alert.save();

    const populatedAlert = await alert.populate(
        "product"
    );

    res.status(200).json({
        success: true,
        message: "Price alert updated",
        data: {
            alert: populatedAlert
        }
    });
});

const deletePriceAlert = asyncHandler(async (req, res) => {
    const alert = await PriceAlert.findOne({
        _id: req.params.id,
        user: req.user._id
    });

    if (!alert) {
        return res.status(404).json({
            success: false,
            message: "Price alert not found"
        });
    }

    await alert.deleteOne();

    res.status(200).json({
        success: true,
        message: "Price alert deleted"
    });
});

export {
    createPriceAlert,
    getPriceAlerts,
    updatePriceAlert,
    deletePriceAlert
};
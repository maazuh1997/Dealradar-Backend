import PriceHistory from "../models/PriceHistory.js";
import Offer from "../models/Offer.js";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
    calculateDealScore,
    calculatePriceStats
} from "../services/pricing/dealScore.service.js";

const getProductPriceHistory = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const product = await Product.findById(productId);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }

    const {
        days = 90,
        merchant
    } = req.query;

    const daysNumber = Math.min(
        Math.max(Number(days), 1),
        3650
    );

    const startDate = new Date();

    startDate.setDate(
        startDate.getDate() - daysNumber
    );

    const filter = {
        product: productId,
        recordedAt: {
            $gte: startDate
        }
    };

    if (merchant) {
        filter.merchant = merchant;
    }

    const history = await PriceHistory.find(filter)
        .sort({
            recordedAt: 1
        })
        .lean();

    const stats = calculatePriceStats(history);

    res.status(200).json({
        success: true,
        data: {
            history,
            stats,
            period: {
                days: daysNumber,
                from: startDate,
                to: new Date()
            }
        }
    });
});

const getProductPriceStats = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const product = await Product.findById(productId);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }

    const history = await PriceHistory.find({
        product: productId
    })
        .sort({
            recordedAt: 1
        })
        .lean();

    const stats = calculatePriceStats(history);

    const offers = await Offer.find({
        product: productId,
        availability: {
            $ne: "out_of_stock"
        }
    })
        .sort({
            price: 1
        })
        .lean();

    const currentPrices = offers.map(
        (offer) => offer.price
    );

    const currentLowestPrice = currentPrices.length
        ? Math.min(...currentPrices)
        : 0;

    const currentAveragePrice = currentPrices.length
        ? Number(
            (
                currentPrices.reduce(
                    (sum, price) => sum + price,
                    0
                ) / currentPrices.length
            ).toFixed(2)
        )
        : 0;

    const lowestHistoricalPrice = stats.lowestPrice;

    const bestOffer = offers[0];

    let dealScore = {
        score: 0,
        label: "Unknown"
    };

    if (bestOffer) {
        dealScore = calculateDealScore({
            currentPrice: bestOffer.price,
            originalPrice: bestOffer.originalPrice,
            lowestPrice: lowestHistoricalPrice,
            averagePrice: stats.averagePrice || currentAveragePrice,
            merchantCount: offers.length,
            historyCount: history.length
        });
    }

    res.status(200).json({
        success: true,
        data: {
            current: {
                lowestPrice: currentLowestPrice,
                averagePrice: currentAveragePrice,
                merchantCount: offers.length
            },
            historical: stats,
            bestOffer: bestOffer || null,
            dealScore
        }
    });
});

export {
    getProductPriceHistory,
    getProductPriceStats
};
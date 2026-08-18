import mongoose from "mongoose";
import PriceHistory from "../models/PriceHistory.js";
import Offer from "../models/Offer.js";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
    calculateDealScore,
    calculatePriceStats,
    calculatePriceIntelligence,
    calculatePriceTrend,
    getBuyRecommendation
} from "../services/pricing/dealScore.service.js";
import {
    calculateForecast
} from "../services/pricing/priceForecast.service.js";
import ProductVariant from "../models/ProductVariant.js";

const findProductByIdentifier = async (
    identifier
) => {
    let product = null;

    if (
        mongoose.Types.ObjectId.isValid(
            identifier
        )
    ) {
        product =
            await Product.findById(
                identifier
            );
    }

    if (!product) {
        product =
            await Product.findOne({
                slug:
                    identifier
            });
    }

    if (!product) {
        product =
            await Product.findOne({
                "metadata.externalId":
                    identifier,
                "metadata.provider":
                    "pricesapi"
            });
    }

    if (!product) {
        product =
            await Product.findOne({
                providerIds: {
                    $elemMatch: {
                        externalId:
                            String(
                                identifier
                            )
                    }
                }
            });
    }

    return product;
};

const getProductPriceHistory =
    asyncHandler(
        async (
            req,
            res
        ) => {
            const {
                productId
            } = req.params;

            const product =
                await findProductByIdentifier(
                    productId
                );

            if (!product) {
                return res.status(
                    404
                ).json({
                    success:
                        false,
                    message:
                        "Product not found"
                });
            }

            const {
                days = 90,
                merchant
            } = req.query;

            const daysNumber =
                Math.min(
                    Math.max(
                        Number(
                            days
                        ),
                        1
                    ),
                    3650
                );

            const startDate =
                new Date();

            startDate.setDate(
                startDate.getDate() -
                daysNumber
            );

            const filter = {
                product:
                    product._id,
                recordedAt: {
                    $gte:
                        startDate
                }
            };

            if (merchant) {
                filter.merchant =
                    merchant;
            }

            const history =
                await PriceHistory.find(
                    filter
                )
                    .sort({
                        recordedAt:
                            1
                    })
                    .lean();

            const stats =
                calculatePriceStats(
                    history
                );

            res.status(
                200
            ).json({
                success:
                    true,
                data: {
                    history,
                    stats,
                    period: {
                        days:
                            daysNumber,
                        from:
                            startDate,
                        to:
                            new Date()
                    }
                }
            });
        }
    );

const getProductPriceStats =
    asyncHandler(
        async (
            req,
            res
        ) => {
            const {
                productId
            } = req.params;

            const product =
                await findProductByIdentifier(
                    productId
                );

            if (!product) {
                return res.status(
                    404
                ).json({
                    success:
                        false,
                    message:
                        "Product not found"
                });
            }

            const history =
                await PriceHistory.find({
                    product:
                        product._id
                })
                    .sort({
                        recordedAt:
                            1
                    })
                    .lean();

            const stats =
                calculatePriceStats(
                    history
                );

            const trend =
                calculatePriceTrend(
                    history
                );

            const offers =
                await Offer.find({
                    product:
                        product._id,
                    availability: {
                        $ne:
                            "out_of_stock"
                    }
                })
                    .sort({
                        price:
                            1
                    })
                    .lean();

            const currentPrices =
                offers.map(
                    (
                        offer
                    ) =>
                        offer.price
                );

            const currentLowestPrice =
                currentPrices.length
                    ? Math.min(
                        ...currentPrices
                    )
                    : 0;

            const currentAveragePrice =
                currentPrices.length
                    ? Number(
                        (
                            currentPrices.reduce(
                                (
                                    sum,
                                    price
                                ) =>
                                    sum +
                                    price,
                                0
                            ) /
                            currentPrices.length
                        ).toFixed(
                            2
                        )
                    )
                    : 0;

            const lowestHistoricalPrice =
                stats.lowestPrice;

            const bestOffer =
                offers[0];

            const intelligence =
                calculatePriceIntelligence({
                    currentPrice:
                        currentLowestPrice,
                    lowestPrice:
                        stats.lowestPrice,
                    highestPrice:
                        stats.highestPrice,
                    averagePrice:
                        stats.averagePrice ||
                        currentAveragePrice,
                    history,
                    merchantCount:
                        offers.length
                });

            const forecast =
                calculateForecast({
                    currentPrice:
                        currentLowestPrice,
                    history
                });

            let dealScore = {
                score:
                    0,
                label:
                    "Unknown"
            };

            if (bestOffer) {
                dealScore =
                    calculateDealScore({
                        currentPrice:
                            bestOffer.price,
                        originalPrice:
                            bestOffer.originalPrice,
                        lowestPrice:
                            lowestHistoricalPrice,
                        averagePrice:
                            stats.averagePrice ||
                            currentAveragePrice,
                        merchantCount:
                            offers.length,
                        historyCount:
                            history.length
                    });
            }

            const recommendation =
                getBuyRecommendation({
                    dealScore:
                        dealScore.score,
                    trend,
                    currentPrice:
                        currentLowestPrice,
                    lowestPrice:
                        lowestHistoricalPrice,
                    averagePrice:
                        stats.averagePrice ||
                        currentAveragePrice
                });

            res.status(
                200
            ).json({
                success:
                    true,
                data: {
                    current: {
                        lowestPrice:
                            currentLowestPrice,
                        averagePrice:
                            currentAveragePrice,
                        merchantCount:
                            offers.length
                    },
                    historical:
                        stats,
                    bestOffer:
                        bestOffer ||
                        null,
                    dealScore,
                    intelligence,
                    forecast,
                    trend,
                    recommendation
                }
            });
        }
    );

const getVariantPriceHistory =
    asyncHandler(
        async (
            req,
            res
        ) => {
            const {
                variantId
            } = req.params;

            const variant =
                await ProductVariant.findById(
                    variantId
                ).lean();

            if (!variant) {
                return res.status(
                    404
                ).json({
                    success:
                        false,
                    message:
                        "Variant not found"
                });
            }

            const {
                days = 90,
                merchant
            } = req.query;

            const daysNumber =
                Math.min(
                    Math.max(
                        Number(
                            days
                        ) || 90,
                        1
                    ),
                    3650
                );

            const startDate =
                new Date();

            startDate.setDate(
                startDate.getDate() -
                daysNumber
            );

            const offerQuery = {
                variant:
                    variant._id
            };

            if (merchant) {
                offerQuery.merchant =
                    merchant;
            }

            const offers =
                await Offer.find(
                    offerQuery
                )
                    .select(
                        "_id merchant merchantKey price currency"
                    )
                    .lean();

            const offerIds =
                offers.map(
                    (
                        offer
                    ) =>
                        offer._id
                );

            const history =
                offerIds.length
                    ? await PriceHistory.find({
                        offer: {
                            $in:
                                offerIds
                        },
                        recordedAt: {
                            $gte:
                                startDate
                        }
                    })
                        .sort({
                            recordedAt:
                                1
                        })
                        .lean()
                    : [];

            const stats =
                calculatePriceStats(
                    history
                );

            res.status(
                200
            ).json({
                success:
                    true,
                data: {
                    variant,
                    history,
                    stats,
                    period: {
                        days:
                            daysNumber,
                        from:
                            startDate,
                        to:
                            new Date()
                    }
                }
            });
        }
    );

const getVariantPriceStats =
    asyncHandler(
        async (
            req,
            res
        ) => {
            const {
                variantId
            } = req.params;

            const variant =
                await ProductVariant.findById(
                    variantId
                ).lean();

            if (!variant) {
                return res.status(
                    404
                ).json({
                    success:
                        false,
                    message:
                        "Variant not found"
                });
            }

            const history =
                await PriceHistory.find({
                    product:
                        variant.product,
                    offer: {
                        $in:
                            await Offer.find({
                                variant:
                                    variant._id
                            })
                                .distinct(
                                    "_id"
                                )
                    }
                })
                    .sort({
                        recordedAt:
                            1
                    })
                    .lean();

            const stats =
                calculatePriceStats(
                    history
                );

            const trend =
                calculatePriceTrend(
                    history
                );

            const offers =
                await Offer.find({
                    variant:
                        variant._id,
                    availability: {
                        $ne:
                            "out_of_stock"
                    }
                })
                    .sort({
                        price:
                            1
                    })
                    .lean();

            const currentPrices =
                offers
                    .map(
                        (
                            offer
                        ) =>
                            Number(
                                offer.price
                            )
                    )
                    .filter(
                        (
                            price
                        ) =>
                            Number.isFinite(
                                price
                            )
                    );

            const currentLowestPrice =
                currentPrices.length
                    ? Math.min(
                        ...currentPrices
                    )
                    : 0;

            const currentAveragePrice =
                currentPrices.length
                    ? Number(
                        (
                            currentPrices.reduce(
                                (
                                    sum,
                                    price
                                ) =>
                                    sum +
                                    price,
                                0
                            ) /
                            currentPrices.length
                        ).toFixed(
                            2
                        )
                    )
                    : 0;

            const bestOffer =
                offers[0] ||
                null;

            const intelligence =
                calculatePriceIntelligence({
                    currentPrice:
                        currentLowestPrice,
                    lowestPrice:
                        stats.lowestPrice,
                    highestPrice:
                        stats.highestPrice,
                    averagePrice:
                        stats.averagePrice ||
                        currentAveragePrice,
                    history,
                    merchantCount:
                        offers.length
                });

            const forecast =
                calculateForecast({
                    currentPrice:
                        currentLowestPrice,
                    history
                });

            let dealScore = {
                score:
                    0,
                label:
                    "Unknown"
            };

            if (bestOffer) {
                dealScore =
                    calculateDealScore({
                        currentPrice:
                            bestOffer.price,
                        originalPrice:
                            bestOffer.originalPrice,
                        lowestPrice:
                            stats.lowestPrice,
                        averagePrice:
                            stats.averagePrice ||
                            currentAveragePrice,
                        merchantCount:
                            offers.length,
                        historyCount:
                            history.length
                    });
            }

            const recommendation =
                getBuyRecommendation({
                    dealScore:
                        dealScore.score,
                    trend,
                    currentPrice:
                        currentLowestPrice,
                    lowestPrice:
                        stats.lowestPrice,
                    averagePrice:
                        stats.averagePrice ||
                        currentAveragePrice
                });

            res.status(
                200
            ).json({
                success:
                    true,
                data: {
                    variant,
                    current: {
                        lowestPrice:
                            currentLowestPrice,
                        averagePrice:
                            currentAveragePrice,
                        merchantCount:
                            offers.length
                    },
                    historical:
                        stats,
                    bestOffer,
                    dealScore,
                    intelligence,
                    forecast,
                    trend,
                    recommendation
                }
            });
        }
    );

export {
    getProductPriceHistory,
    getProductPriceStats,
    getVariantPriceHistory,
    getVariantPriceStats
};
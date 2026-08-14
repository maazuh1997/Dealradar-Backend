import asyncHandler from "../utils/asyncHandler.js";
import Product from "../models/Product.js";
import Offer from "../models/Offer.js";
import PriceHistory from "../models/PriceHistory.js";
import Watchlist from "../models/Watchlist.js";
import {
    normalizeProviderResult
} from "../services/providers/normalizeProviderResult.js";
import createSlug from "../utils/createSlug.js";

const createTrackedProduct = asyncHandler(
    async (req, res) => {
        const {
            product,
            offers = []
        } = req.body;

        if (!product?.title) {
            return res.status(400).json({
                success: false,
                message:
                    "Product information is required"
            });
        }

        let existingProduct = null;

        if (
            product.externalId &&
            product.provider
        ) {
            existingProduct =
                await Product.findOne({
                    "metadata.externalId":
                        product.externalId,
                    "metadata.provider":
                        product.provider
                });
        }

        if (!existingProduct) {
            const baseSlug =
                createSlug(
                    product.title
                );

            let slug = baseSlug;
            let counter = 1;

            while (
                await Product.exists({
                    slug
                })
            ) {
                slug =
                    `${baseSlug}-${counter}`;
                counter += 1;
            }

            existingProduct =
                await Product.create({
                    title:
                        product.title,
                    slug,
                    brand:
                        product.brand,
                    category:
                        product.category,
                    description:
                        product.description,
                    images:
                        product.image
                            ? [product.image]
                            : [],
                    rating:
                        product.rating || 0,
                    reviewCount:
                        product.reviewCount ||
                        0,
                    identifiers:
                        product.identifiers ||
                        {},
                    metadata: {
                        externalId:
                            product.externalId,
                        provider:
                            product.provider
                    }
                });
        }

        const normalizedOffers =
            offers
                .map(
                    (offer) =>
                        normalizeProviderResult({
                            ...offer,
                            title:
                                product.title,
                            image:
                                product.image,
                            brand:
                                product.brand,
                            category:
                                product.category,
                            provider:
                                offer.provider ||
                                product.provider,
                            productExternalId:
                                product.externalId
                        })
                )
                .filter(Boolean);

        for (
            const offerData of normalizedOffers
        ) {
            let offer =
                await Offer.findOne({
                    product:
                        existingProduct._id,
                    merchant:
                        offerData.merchant,
                    provider:
                        offerData.provider
                });

            if (!offer) {
                offer =
                    await Offer.create({
                        product:
                            existingProduct._id,
                        merchant:
                            offerData.merchant,
                        title:
                            offerData.title,
                        url:
                            offerData.url,
                        affiliateUrl:
                            offerData.affiliateUrl,
                        price:
                            offerData.price,
                        originalPrice:
                            offerData.originalPrice,
                        currency:
                            offerData.currency,
                        availability:
                            offerData.availability,
                        shippingCost:
                            offerData.shippingCost,
                        provider:
                            offerData.provider,
                        lastChecked:
                            new Date()
                    });

                await PriceHistory.create({
                    product:
                        existingProduct._id,
                    offer:
                        offer._id,
                    merchant:
                        offer.merchant,
                    price:
                        offer.price,
                    currency:
                        offer.currency,
                    recordedAt:
                        new Date()
                });

                continue;
            }

            const previousPrice =
                offer.price;

            offer.price =
                offerData.price;

            offer.originalPrice =
                offerData.originalPrice;

            offer.url =
                offerData.url;

            offer.affiliateUrl =
                offerData.affiliateUrl;

            offer.currency =
                offerData.currency;

            offer.availability =
                offerData.availability;

            offer.shippingCost =
                offerData.shippingCost;

            offer.lastChecked =
                new Date();

            await offer.save();

            if (
                previousPrice !==
                offer.price
            ) {
                await PriceHistory.create({
                    product:
                        existingProduct._id,
                    offer:
                        offer._id,
                    merchant:
                        offer.merchant,
                    price:
                        offer.price,
                    currency:
                        offer.currency,
                    recordedAt:
                        new Date()
                });
            }
        }

        const watchlistItem =
            await Watchlist.findOneAndUpdate(
                {
                    user:
                        req.user._id,
                    product:
                        existingProduct._id
                },
                {
                    $setOnInsert: {
                        user:
                            req.user._id,
                        product:
                            existingProduct._id
                    }
                },
                {
                    upsert: true,
                    new: true
                }
            );

        const populated =
            await watchlistItem.populate(
                "product"
            );

        res.status(201).json({
            success: true,
            message:
                "Product added to your watchlist",
            data: {
                product:
                    existingProduct,
                watchlist:
                    populated
            }
        });
    }
);

export {
    createTrackedProduct
};
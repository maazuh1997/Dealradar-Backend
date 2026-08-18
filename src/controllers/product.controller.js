import mongoose from "mongoose";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";
import createSlug from "../utils/createSlug.js";
import pricesApiProvider from "../services/providers/pricesApi.provider.js";
import PriceAlert from "../models/PriceAlert.js";
import Watchlist from "../models/Watchlist.js";
import Offer from "../models/Offer.js";
import PriceHistory from "../models/PriceHistory.js";
import Notification from "../models/Notification.js";
import ProductVariant from "../models/ProductVariant.js";

const createProduct = asyncHandler(async (req, res) => {
    const {
        title,
        brand,
        category,
        description,
        images,
        identifiers,
        specifications,
        rating,
        reviewCount,
        metadata
    } = req.body;

    if (!title) {
        return res.status(400).json({
            success: false,
            message: "Product title is required"
        });
    }

    const baseSlug = createSlug(title);

    let slug = baseSlug;
    let counter = 1;

    while (await Product.exists({ slug })) {
        slug = `${baseSlug}-${counter}`;
        counter += 1;
    }

    const product = await Product.create({
        title: title.trim(),
        slug,
        brand,
        category,
        description,
        images,
        identifiers,
        specifications,
        rating,
        reviewCount,
        metadata
    });

    res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: {
            product
        }
    });
});

const getProducts = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        category,
        brand,
        sort = "newest"
    } = req.query;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(Number(limit), 1), 100);

    const filter = {};

    if (category) {
        filter.category = category;
    }

    if (brand) {
        filter.brand = brand;
    }

    let sortOption = {
        createdAt: -1
    };

    if (sort === "oldest") {
        sortOption = {
            createdAt: 1
        };
    }

    if (sort === "rating") {
        sortOption = {
            rating: -1
        };
    }

    if (sort === "reviews") {
        sortOption = {
            reviewCount: -1
        };
    }

    const skip = (pageNumber - 1) * limitNumber;

    const [products, total] = await Promise.all([
        Product.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(limitNumber),
        Product.countDocuments(filter)
    ]);

    res.status(200).json({
        success: true,
        data: {
            products,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                total,
                pages: Math.ceil(total / limitNumber),
                hasNextPage: pageNumber * limitNumber < total,
                hasPreviousPage: pageNumber > 1
            }
        }
    });
});

const searchProducts = asyncHandler(async (req, res) => {
    const {
        q,
        page = 1,
        limit = 20
    } = req.query;

    if (!q?.trim()) {
        return res.status(400).json({
            success: false,
            message: "Search query is required"
        });
    }

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(Number(limit), 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const searchQuery = {
        $text: {
            $search: q.trim()
        }
    };

    const [products, total] = await Promise.all([
        Product.find(
            searchQuery,
            {
                score: {
                    $meta: "textScore"
                }
            }
        )
            .sort({
                score: {
                    $meta: "textScore"
                }
            })
            .skip(skip)
            .limit(limitNumber),
        Product.countDocuments(searchQuery)
    ]);

    res.status(200).json({
        success: true,
        data: {
            products,
            query: q.trim(),
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                total,
                pages: Math.ceil(total / limitNumber),
                hasNextPage: pageNumber * limitNumber < total,
                hasPreviousPage: pageNumber > 1
            }
        }
    });
});

const getProductBySlug = asyncHandler(async (req, res) => {
    const identifier = req.params.slug;

    let product = null;

    if (mongoose.Types.ObjectId.isValid(identifier)) {
        product = await Product.findById(
            identifier
        );
    }

    if (!product) {
        product = await Product.findOne({
            slug: identifier
        });
    }

    if (!product) {
        product = await Product.findOne({
            "metadata.externalId": identifier,
            "metadata.provider": "pricesapi"
        });
    }

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }

    let provider = null;

    const externalId =
        product.metadata?.externalId;

    const providerName =
        product.metadata?.provider;

    if (
        externalId &&
        providerName === "pricesapi"
    ) {
        const storedOffers =
            await Offer.find({
                product:
                    product._id
            })
                .sort({
                    price: 1
                })
                .lean();

        if (
            storedOffers.length
        ) {
            const offers =
                storedOffers.map(
                    (offer) => ({
                        externalId:
                            offer._id.toString(),
                        title:
                            offer.title ||
                            product.title,
                        merchant:
                            offer.merchant,
                        merchantUrl:
                            null,
                        url:
                            offer.url,
                        affiliateUrl:
                            offer.affiliateUrl ||
                            offer.url,
                        price:
                            Number(
                                offer.price
                            ),
                        totalPrice:
                            Number(
                                offer.price
                            ) +
                            (
                                Number(
                                    offer.shippingCost
                                ) || 0
                            ),
                        currency:
                            offer.currency ||
                            "USD",
                        availability:
                            offer.availability ||
                            "unknown",
                        shippingCost:
                            Number(
                                offer.shippingCost
                            ) || 0,
                        condition:
                            null,
                        image:
                            product.images?.[0] ||
                            null,
                        brand:
                            product.brand ||
                            null,
                        category:
                            product.category ||
                            null,
                        provider:
                            offer.provider,
                        productExternalId:
                            externalId
                    })
                );

            const bestOffer =
                offers[0] || null;

            provider = {
                provider:
                    providerName,
                externalId,
                product: {
                    externalId,
                    title:
                        product.title,
                    image:
                        product.images?.[0] ||
                        null,
                    merchant:
                        bestOffer?.merchant ||
                        "Unknown",
                    url:
                        bestOffer?.url ||
                        "",
                    affiliateUrl:
                        bestOffer?.affiliateUrl ||
                        "",
                    price:
                        bestOffer?.price ||
                        0,
                    currency:
                        bestOffer?.currency ||
                        "USD",
                    rating:
                        product.rating ||
                        0,
                    reviewCount:
                        product.reviewCount ||
                        0,
                    offers,
                    bestOffer
                },
                offers
            };
        } else {
            provider =
                await pricesApiProvider.getProduct({
                    externalId,
                    query:
                        product.metadata?.query ||
                        product.title
                });
        }
    }

    res.status(200).json({
        success: true,
        data: {
            product,
            provider
        }
    });
});

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

const getProductVariants =
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

            const variants =
                await ProductVariant.find({
                    product:
                        product._id
                })
                    .sort({
                        createdAt:
                            1
                    })
                    .lean();

            const variantIds =
                variants.map(
                    (
                        variant
                    ) =>
                        variant._id
                );

            const offers =
                variantIds.length
                    ? await Offer.find({
                        product:
                            product._id,
                        variant: {
                            $in:
                                variantIds
                        }
                    })
                        .sort({
                            price:
                                1
                        })
                        .lean()
                    : [];

            const offersByVariant =
                new Map();

            for (
                const offer of
                offers
            ) {
                const key =
                    String(
                        offer.variant
                    );

                if (
                    !offersByVariant.has(
                        key
                    )
                ) {
                    offersByVariant.set(
                        key,
                        []
                    );
                }

                offersByVariant
                    .get(key)
                    .push(
                        offer
                    );
            }

            const data =
                variants.map(
                    (
                        variant
                    ) => {
                        const variantOffers =
                            offersByVariant.get(
                                String(
                                    variant._id
                                )
                            ) || [];

                        const availableOffers =
                            variantOffers.filter(
                                (
                                    offer
                                ) =>
                                    offer.availability !==
                                    "out_of_stock"
                            );

                        const prices =
                            availableOffers.map(
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

                        const lowestPrice =
                            prices.length
                                ? Math.min(
                                    ...prices
                                )
                                : 0;

                        return {
                            ...variant,
                            offers:
                                variantOffers,
                            offerCount:
                                variantOffers.length,
                            merchantCount:
                                new Set(
                                    variantOffers.map(
                                        (
                                            offer
                                        ) =>
                                            offer.merchantKey ||
                                            offer.merchant
                                    )
                                ).size,
                            lowestPrice
                        };
                    }
                );

            res.status(
                200
            ).json({
                success:
                    true,
                data: {
                    product,
                    variants:
                        data,
                    count:
                        data.length
                }
            });
        }
    );

const updateProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }

    const {
        title,
        brand,
        category,
        description,
        images,
        identifiers,
        specifications,
        rating,
        reviewCount,
        metadata
    } = req.body;

    if (title !== undefined) {
        product.title = title.trim();
    }

    if (brand !== undefined) {
        product.brand = brand;
    }

    if (category !== undefined) {
        product.category = category;
    }

    if (description !== undefined) {
        product.description = description;
    }

    if (images !== undefined) {
        product.images = images;
    }

    if (identifiers !== undefined) {
        product.identifiers = identifiers;
    }

    if (specifications !== undefined) {
        product.specifications = specifications;
    }

    if (rating !== undefined) {
        product.rating = rating;
    }

    if (reviewCount !== undefined) {
        product.reviewCount = reviewCount;
    }

    if (metadata !== undefined) {
        product.metadata = metadata;
    }

    await product.save();

    res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: {
            product
        }
    });
});

const deleteProduct = asyncHandler(async (req, res) => {
    const product =
        await Product.findById(
            req.params.id
        );

    if (!product) {
        return res.status(404).json({
            success: false,
            message:
                "Product not found"
        });
    }

    await Promise.all([
        PriceHistory.deleteMany({
            product:
                product._id
        }),
        Offer.deleteMany({
            product:
                product._id
        }),
        Watchlist.deleteMany({
            product:
                product._id
        }),
        PriceAlert.deleteMany({
            product:
                product._id
        }),
        Notification.deleteMany({
            product:
                product._id
        })
    ]);

    await product.deleteOne();

    res.status(200).json({
        success: true,
        message:
            "Product deleted successfully"
    });
});
export {
    createProduct,
    getProducts,
    searchProducts,
    getProductBySlug,
    getProductVariants,
    updateProduct,
    deleteProduct
};
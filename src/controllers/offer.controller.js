import Offer from "../models/Offer.js";
import Product from "../models/Product.js";
import PriceHistory from "../models/PriceHistory.js";
import asyncHandler from "../utils/asyncHandler.js";
import processPriceAlert from "../services/pricing/priceAlert.service.js";

const calculateDiscount = (price, originalPrice) => {
    if (!originalPrice || originalPrice <= price) {
        return 0;
    }

    return Math.round(((originalPrice - price) / originalPrice) * 100);
};

const createOffer = asyncHandler(async (req, res) => {
    const {
        product,
        merchant,
        title,
        url,
        affiliateUrl,
        price,
        originalPrice,
        currency,
        availability,
        shippingCost,
        provider
    } = req.body;

    if (!product || !merchant || !url || price === undefined || !provider) {
        return res.status(400).json({
            success: false,
            message: "Product, merchant, URL, price and provider are required"
        });
    }

    const productExists = await Product.exists({
        _id: product
    });

    if (!productExists) {
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }

    if (price < 0) {
        return res.status(400).json({
            success: false,
            message: "Price cannot be negative"
        });
    }

    const discountPercentage = calculateDiscount(
        price,
        originalPrice
    );

    const offer = await Offer.create({
        product,
        merchant: merchant.trim(),
        title,
        url,
        affiliateUrl,
        price,
        originalPrice,
        currency: currency || "USD",
        availability: availability || "unknown",
        shippingCost: shippingCost || 0,
        provider,
        lastChecked: new Date()
    });

    await PriceHistory.create({
        product,
        offer: offer._id,
        merchant: offer.merchant,
        price: offer.price,
        currency: offer.currency,
        recordedAt: new Date()
    });
    await processPriceAlert(offer);

    res.status(201).json({
        success: true,
        message: "Offer created successfully",
        data: {
            offer: {
                ...offer.toObject(),
                discountPercentage
            }
        }
    });
});

const getOffersByProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const productExists = await Product.exists({
        _id: productId
    });

    if (!productExists) {
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }

    const offers = await Offer.find({
        product: productId
    }).sort({
        price: 1
    });

    const formattedOffers = offers.map((offer) => ({
        ...offer.toObject(),
        discountPercentage: calculateDiscount(
            offer.price,
            offer.originalPrice
        )
    }));

    res.status(200).json({
        success: true,
        data: {
            offers: formattedOffers
        }
    });
});

const getOfferById = asyncHandler(async (req, res) => {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
        return res.status(404).json({
            success: false,
            message: "Offer not found"
        });
    }

    res.status(200).json({
        success: true,
        data: {
            offer: {
                ...offer.toObject(),
                discountPercentage: calculateDiscount(
                    offer.price,
                    offer.originalPrice
                )
            }
        }
    });
});

const updateOffer = asyncHandler(async (req, res) => {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
        return res.status(404).json({
            success: false,
            message: "Offer not found"
        });
    }

    const {
        merchant,
        title,
        url,
        affiliateUrl,
        price,
        originalPrice,
        currency,
        availability,
        shippingCost,
        provider
    } = req.body;

    const previousPrice = offer.price;

    if (merchant !== undefined) {
        offer.merchant = merchant.trim();
    }

    if (title !== undefined) {
        offer.title = title;
    }

    if (url !== undefined) {
        offer.url = url;
    }

    if (affiliateUrl !== undefined) {
        offer.affiliateUrl = affiliateUrl;
    }

    if (price !== undefined) {
        if (price < 0) {
            return res.status(400).json({
                success: false,
                message: "Price cannot be negative"
            });
        }

        offer.price = price;
    }

    if (originalPrice !== undefined) {
        offer.originalPrice = originalPrice;
    }

    if (currency !== undefined) {
        offer.currency = currency;
    }

    if (availability !== undefined) {
        offer.availability = availability;
    }

    if (shippingCost !== undefined) {
        offer.shippingCost = shippingCost;
    }

    if (provider !== undefined) {
        offer.provider = provider;
    }

    offer.lastChecked = new Date();

    await offer.save();

    if (previousPrice !== offer.price) {
        await PriceHistory.create({
            product: offer.product,
            offer: offer._id,
            merchant: offer.merchant,
            price: offer.price,
            currency: offer.currency,
            recordedAt: new Date()
        });

        await processPriceAlert(offer);
    }

    res.status(200).json({
        success: true,
        message: "Offer updated successfully",
        data: {
            offer: {
                ...offer.toObject(),
                discountPercentage: calculateDiscount(
                    offer.price,
                    offer.originalPrice
                )
            }
        }
    });
});

const deleteOffer = asyncHandler(async (req, res) => {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
        return res.status(404).json({
            success: false,
            message: "Offer not found"
        });
    }

    await PriceHistory.deleteMany({
        offer: offer._id
    });

    await offer.deleteOne();

    res.status(200).json({
        success: true,
        message: "Offer deleted successfully"
    });
});

export {
    createOffer,
    getOffersByProduct,
    getOfferById,
    updateOffer,
    deleteOffer
};
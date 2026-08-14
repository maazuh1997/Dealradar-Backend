import ProductSearchCache from "../../models/ProductSearchCache.js";
import searchProviderWithCache from "../providers/cachedProviderSearch.service.js";
import {
    calculateDealScore
} from "../pricing/dealScore.service.js";

const normalizeQuery = (query) => {
    return query
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
};

const calculateOfferDiscount = (
    price,
    originalPrice
) => {
    if (
        !originalPrice ||
        originalPrice <= price
    ) {
        return 0;
    }

    return Math.round(
        ((originalPrice - price) /
            originalPrice) *
        100
    );
};

const formatOffer = (offer) => {
    const price = Number(offer.price);
    const shipping =
        Number(offer.shippingCost) || 0;

    return {
        merchant: offer.merchant,
        price,
        totalPrice:
            price + shipping,
        currency: offer.currency,
        shippingCost: shipping,
        availability:
            offer.availability,
        url: offer.url,
        affiliateUrl:
            offer.affiliateUrl,
        discountPercentage:
            calculateOfferDiscount(
                price,
                offer.originalPrice
            )
    };
};

const buildProductResult = (
    product
) => {
    const offers = Array.isArray(
        product.offers
    )
        ? product.offers
            .map(formatOffer)
            .filter(
                (offer) =>
                    Number.isFinite(
                        offer.price
                    )
            )
            .sort(
                (a, b) =>
                    a.totalPrice -
                    b.totalPrice
            )
        : [];

    const prices = offers
        .map(
            (offer) =>
                offer.totalPrice
        )
        .filter(
            (price) => price > 0
        );

    const lowestPrice = prices.length
        ? Math.min(...prices)
        : Number(product.price) || 0;

    const averagePrice =
        prices.length
            ? Number(
                (
                    prices.reduce(
                        (sum, price) =>
                            sum + price,
                        0
                    ) /
                    prices.length
                ).toFixed(2)
            )
            : lowestPrice;

    const bestOffer =
        offers[0] || null;

    const dealScore =
        bestOffer
            ? calculateDealScore({
                currentPrice:
                    bestOffer.totalPrice,
                originalPrice:
                    null,
                lowestPrice,
                averagePrice,
                merchantCount:
                    offers.length,
                historyCount: 0
            })
            : {
                score: 0,
                label: "Unknown",
                confidence: "low"
            };

    return {
        externalId:
            product.externalId,
        title: product.title,
        image: product.image,
        brand: product.brand,
        category: product.category,
        rating: product.rating || 0,
        reviewCount:
            product.reviewCount ||
            product.reviews ||
            0,
        currency:
            product.currency ||
            bestOffer?.currency ||
            "USD",
        lowestPrice,
        averagePrice,
        merchantCount:
            offers.length,
        bestOffer,
        dealScore,
        offers
    };
};

const searchProducts = async ({
    query,
    country = "us",
    page = 1,
    limit = 5
}) => {
    const normalizedQuery =
        normalizeQuery(query);

    const normalizedCountry =
        country.toLowerCase();

    const result =
        await searchProviderWithCache({
            providerName: "pricesapi",
            query: normalizedQuery,
            country:
                normalizedCountry,
            page,
            limit
        });

    const products =
        (result.products || []).map(
            buildProductResult
        );

    return {
        query: normalizedQuery,
        country:
            normalizedCountry,
        cached:
            result.cached || false,
        products,
        meta: result.meta || {}
    };
};

export default searchProducts;
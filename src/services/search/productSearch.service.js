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
    const price = Number(
        offer.price
    );

    const shipping =
        Number(
            offer.shippingCost
        ) || 0;

    return {
        merchant:
            offer.merchant,
        price,
        totalPrice:
            price + shipping,
        currency:
            offer.currency ||
            "USD",
        shippingCost:
            shipping,
        availability:
            offer.availability ||
            "unknown",
        url:
            offer.url,
        affiliateUrl:
            offer.affiliateUrl ||
            offer.url ||
            null,
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
    if (
        !product?.externalId ||
        !product?.title
    ) {
        return null;
    }

    const offers =
        Array.isArray(
            product.offers
        )
            ? product.offers
                .map(formatOffer)
                .filter(
                    (offer) =>
                        Number.isFinite(
                            offer.price
                        ) &&
                        offer.price > 0 &&
                        offer.merchant &&
                        offer.url
                )
                .sort(
                    (a, b) =>
                        a.totalPrice -
                        b.totalPrice
                )
            : [];

    if (!offers.length) {
        return null;
    }

    const prices =
        offers
            .map(
                (offer) =>
                    offer.totalPrice
            )
            .filter(
                (price) =>
                    Number.isFinite(
                        price
                    ) &&
                    price > 0
            );

    if (!prices.length) {
        return null;
    }

    const lowestPrice =
        Math.min(...prices);

    const averagePrice =
        Number(
            (
                prices.reduce(
                    (
                        sum,
                        price
                    ) =>
                        sum + price,
                    0
                ) /
                prices.length
            ).toFixed(2)
        );

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
        title:
            product.title,
        image:
            product.image ||
            null,
        brand:
            product.brand ||
            null,
        category:
            product.category ||
            null,
        rating:
            Number(
                product.rating
            ) || 0,
        reviewCount:
            Number(
                product.reviewCount ||
                product.reviews
            ) || 0,
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
            providerName:
                "pricesapi",
            query:
                normalizedQuery,
            country:
                normalizedCountry,
            page,
            limit
        });

    const products =
        Array.isArray(
            result.products
        )
            ? result.products
                .map(
                    buildProductResult
                )
                .filter(Boolean)
            : [];

    return {
        query:
            normalizedQuery,
        country:
            normalizedCountry,
        cached:
            result.cached ||
            false,
        products,
        meta:
            result.meta || {},
        degraded:
            result.degraded ||
            result.meta?.degraded ||
            false
    };
};

export default searchProducts;
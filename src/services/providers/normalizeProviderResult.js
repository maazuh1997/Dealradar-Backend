import {
    getMerchantIdentity
} from "../merchants/merchantIdentity.service.js";
import {
    extractVariantAttributes
} from "../products/productVariantExtractor.service.js";

const normalizeOffer = (
    offer,
    product
) => {
    if (!offer) {
        return null;
    }

    const price =
        Number(
            offer.price
        );

    if (
        !offer.merchant ||
        !offer.url ||
        !Number.isFinite(
            price
        ) ||
        price < 0
    ) {
        return null;
    }

    const merchantIdentity =
        getMerchantIdentity({
            merchant:
                offer.merchant,
            merchantUrl:
                offer.merchantUrl
        });

    const originalPrice =
        offer.originalPrice !==
            undefined
            ? Number(
                offer.originalPrice
            )
            : undefined;

    const shippingCost =
        Number(
            offer.shippingCost
        );

    const variantExtraction =
        extractVariantAttributes({
            title:
                offer.title ||
                product.title,
            attributes:
                offer.attributes ||
                {},
            options:
                offer.options ||
                {},
            specifications:
                offer.specifications ||
                product.specifications ||
                {}
        });

    return {
        externalId:
            offer.externalId ||
            `${product.externalId}-${offer.merchant}`,
        title:
            offer.title ||
            product.title,
        merchant:
            merchantIdentity.canonicalName,
        merchantKey:
            merchantIdentity.key,
        merchantName:
            offer.merchant.trim(),
        merchantUrl:
            offer.merchantUrl ||
            null,
        url:
            offer.url.trim(),
        affiliateUrl:
            offer.affiliateUrl?.trim() ||
            offer.url.trim(),
        price,
        originalPrice:
            Number.isFinite(
                originalPrice
            ) &&
                originalPrice >= 0
                ? originalPrice
                : undefined,
        totalPrice:
            price +
            (
                Number.isFinite(
                    shippingCost
                ) &&
                    shippingCost >= 0
                    ? shippingCost
                    : 0
            ),
        currency: (
            offer.currency ||
            product.currency ||
            "USD"
        ).toUpperCase(),
        availability:
            offer.availability ||
            "unknown",
        shippingCost:
            Number.isFinite(
                shippingCost
            ) &&
                shippingCost >= 0
                ? shippingCost
                : 0,
        condition:
            offer.condition ||
            null,
        image:
            offer.image ||
            product.image ||
            null,
        brand:
            offer.brand ||
            product.brand ||
            null,
        category:
            offer.category ||
            product.category ||
            null,
        attributes:
            variantExtraction.attributes,
        variantConfidence:
            variantExtraction.confidence,
        variantSources:
            variantExtraction.sources,
        provider:
            offer.provider ||
            product.provider,
        productExternalId:
            offer.productExternalId ||
            product.externalId ||
            null
    };
};

const normalizeProviderResult = (
    result
) => {
    if (!result) {
        return null;
    }

    const price =
        Number(
            result.price
        );

    const originalPrice =
        result.originalPrice !==
            undefined
            ? Number(
                result.originalPrice
            )
            : undefined;

    if (
        !result.title
    ) {
        return null;
    }

    if (
        !Number.isFinite(
            price
        ) ||
        price < 0
    ) {
        return null;
    }

    const variantExtraction =
        extractVariantAttributes({
            title:
                result.title,
            attributes:
                result.attributes ||
                {},
            options:
                result.options ||
                {},
            specifications:
                result.specifications ||
                {}
        });

    const product = {
        externalId:
            result.externalId ||
            null,
        title:
            result.title.trim(),
        merchant:
            result.merchant?.trim() ||
            null,
        url:
            result.url?.trim() ||
            null,
        affiliateUrl:
            result.affiliateUrl?.trim() ||
            result.url?.trim() ||
            null,
        price,
        originalPrice:
            Number.isFinite(
                originalPrice
            ) &&
                originalPrice >= 0
                ? originalPrice
                : undefined,
        currency: (
            result.currency ||
            "USD"
        ).toUpperCase(),
        availability:
            result.availability ||
            "unknown",
        shippingCost:
            Number(
                result.shippingCost
            ) >= 0
                ? Number(
                    result.shippingCost
                )
                : 0,
        image:
            result.image ||
            null,
        brand:
            result.brand?.trim() ||
            null,
        category:
            result.category?.trim() ||
            null,
        attributes:
            variantExtraction.attributes,
        variantConfidence:
            variantExtraction.confidence,
        variantSources:
            variantExtraction.sources,
        identifiers:
            result.identifiers ||
            {},
        specifications:
            result.specifications ||
            {},
        provider:
            result.provider,
        productExternalId:
            result.productExternalId ||
            null
    };

    const offers =
        Array.isArray(
            result.offers
        )
            ? result.offers
                .map(
                    (
                        offer
                    ) =>
                        normalizeOffer(
                            offer,
                            product
                        )
                )
                .filter(Boolean)
            : [];

    const bestOffer =
        result.bestOffer
            ? normalizeOffer(
                result.bestOffer,
                product
            )
            : offers[0] ||
            null;

    return {
        ...product,
        offers,
        bestOffer
    };
};

const normalizeProviderResults = (
    results
) => {
    if (!Array.isArray(results)) {
        return [];
    }

    return results
        .map(
            normalizeProviderResult
        )
        .filter(Boolean);
};

export {
    normalizeProviderResult,
    normalizeProviderResults
};
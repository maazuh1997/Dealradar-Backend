const normalizeProviderResult = (result) => {
    if (!result) {
        return null;
    }

    const price = Number(result.price);

    const originalPrice =
        result.originalPrice !== undefined
            ? Number(result.originalPrice)
            : undefined;

    if (
        !result.title ||
        !result.merchant ||
        !result.url
    ) {
        return null;
    }

    if (
        !Number.isFinite(price) ||
        price < 0
    ) {
        return null;
    }

    return {
        externalId:
            result.externalId || null,
        title: result.title.trim(),
        merchant:
            result.merchant.trim(),
        url: result.url.trim(),
        affiliateUrl:
            result.affiliateUrl?.trim() ||
            null,
        price,
        originalPrice:
            Number.isFinite(originalPrice) &&
                originalPrice >= 0
                ? originalPrice
                : undefined,
        currency: (
            result.currency || "USD"
        ).toUpperCase(),
        availability:
            result.availability ||
            "unknown",
        shippingCost:
            Number(result.shippingCost) >= 0
                ? Number(result.shippingCost)
                : 0,
        image:
            result.image || null,
        brand:
            result.brand?.trim() || null,
        category:
            result.category?.trim() || null,
        provider:
            result.provider,
        productExternalId:
            result.productExternalId ||
            null
    };
};

const normalizeProviderResults = (
    results
) => {
    if (!Array.isArray(results)) {
        return [];
    }

    return results
        .map(normalizeProviderResult)
        .filter(Boolean);
};

export {
    normalizeProviderResult,
    normalizeProviderResults
};
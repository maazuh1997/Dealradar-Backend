import ProductSearchCache from "../../models/ProductSearchCache.js";
import searchProvider from "./providerSearch.service.js";

const CACHE_MINUTES = 30;

const normalizeQuery = (query) => {
    return query
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
};

const hasValidProducts = (
    products
) => {
    return (
        Array.isArray(products) &&
        products.length > 0
    );
};

const searchProviderWithCache = async ({
    providerName,
    query,
    country,
    page = 1,
    limit = 5
}) => {
    const normalizedQuery =
        normalizeQuery(query);

    const normalizedCountry =
        country?.toLowerCase() ||
        "us";

    const cache =
        await ProductSearchCache.findOne({
            query:
                normalizedQuery,
            country:
                normalizedCountry,
            provider:
                providerName,
            expiresAt: {
                $gt: new Date()
            }
        }).lean();

    if (
        cache &&
        hasValidProducts(
            cache.results
        ) &&
        cache.meta?.degraded !==
        true
    ) {
        return {
            provider:
                providerName,
            query:
                normalizedQuery,
            country:
                normalizedCountry,
            page,
            limit,
            cached: true,
            products:
                cache.results,
            meta:
                cache.meta || {},
            degraded:
                cache.meta
                    ?.degraded === true
        };
    }

    const result =
        await searchProvider({
            providerName,
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
            : [];

    const meta =
        result.meta || {};

    const degraded =
        result.degraded === true ||
        meta.degraded === true;

    const shouldCache =
        hasValidProducts(
            products
        ) &&
        !degraded;

    if (shouldCache) {
        const expiresAt =
            new Date(
                Date.now() +
                CACHE_MINUTES *
                60 *
                1000
            );

        await ProductSearchCache.findOneAndUpdate(
            {
                query:
                    normalizedQuery,
                country:
                    normalizedCountry,
                provider:
                    providerName
            },
            {
                $set: {
                    results:
                        products,
                    meta: {
                        ...meta,
                        degraded:
                            false
                    },
                    expiresAt
                }
            },
            {
                upsert: true,
                new: true
            }
        );
    } else {
        await ProductSearchCache.deleteOne(
            {
                query:
                    normalizedQuery,
                country:
                    normalizedCountry,
                provider:
                    providerName
            }
        );
    }

    return {
        ...result,
        provider:
            providerName,
        query:
            normalizedQuery,
        country:
            normalizedCountry,
        page,
        limit,
        cached: false,
        products,
        meta,
        degraded
    };
};

export default searchProviderWithCache;
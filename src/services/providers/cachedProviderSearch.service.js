import ProductSearchCache from "../../models/ProductSearchCache.js";
import searchProvider from "./providerSearch.service.js";

const CACHE_MINUTES = 30;

const normalizeQuery = (query) => {
    return query
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
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
        country?.toLowerCase() || "us";

    const cache =
        await ProductSearchCache.findOne({
            query: normalizedQuery,
            country: normalizedCountry,
            provider: providerName,
            expiresAt: {
                $gt: new Date()
            }
        }).lean();

    if (cache) {
        return {
            provider: providerName,
            query: normalizedQuery,
            country: normalizedCountry,
            page,
            limit,
            cached: true,
            products: cache.results,
            meta: cache.meta
        };
    }

    const result =
        await searchProvider({
            providerName,
            query: normalizedQuery,
            country: normalizedCountry,
            page,
            limit
        });

    const expiresAt =
        new Date(
            Date.now() +
            CACHE_MINUTES *
            60 *
            1000
        );

    await ProductSearchCache.findOneAndUpdate(
        {
            query: normalizedQuery,
            country: normalizedCountry,
            provider: providerName
        },
        {
            $set: {
                results:
                    result.products || [],
                meta: result.meta || {},
                expiresAt
            }
        },
        {
            upsert: true,
            new: true
        }
    );

    return {
        ...result,
        cached: false
    };
};

export default searchProviderWithCache;
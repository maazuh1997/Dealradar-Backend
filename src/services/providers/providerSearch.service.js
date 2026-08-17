import {
    getProvider
} from "./providerManager.js";
import {
    normalizeProviderResults
} from "./normalizeProviderResult.js";

const searchProvider = async ({
    providerName,
    query,
    country,
    page = 1,
    limit = 20
}) => {
    const provider =
        getProvider(providerName);

    const result =
        await provider.search({
            query,
            country,
            page,
            limit
        });

    return {
        provider:
            providerName,
        query,
        country,
        page,
        limit,
        products:
            normalizeProviderResults(
                result?.products ||
                []
            ),
        meta:
            result?.meta || {},
        degraded:
            result?.degraded === true ||
            result?.meta?.degraded === true
    };
};

export default searchProvider;
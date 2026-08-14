import asyncHandler from "../utils/asyncHandler.js";
import {
    getProviders
} from "../services/providers/providerManager.js";
import searchProviderWithCache from "../services/providers/cachedProviderSearch.service.js";
import {
    normalizeProviderResults
} from "../services/providers/normalizeProviderResult.js";
import {
    ingestOffers
} from "../services/pricing/offerIngestion.service.js";
import {
    refreshPrices
} from "../services/pricing/priceRefresh.service.js";

const listProviders = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            providers: getProviders()
        }
    });
});

const searchProductsFromProvider = asyncHandler(
    async (req, res) => {
        const {
            provider,
            q,
            page = 1,
            limit = 20
        } = req.query;

        if (!provider) {
            return res.status(400).json({
                success: false,
                message: "Provider is required"
            });
        }

        if (!q?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Search query is required"
            });
        }

        const result =
            await searchProviderWithCache({
                providerName: provider,
                query: q.trim(),
                country: req.query.country,
                page,
                limit
            });

        res.status(200).json({
            success: true,
            data: result
        });
    }
);

const ingestProviderOffers = asyncHandler(
    async (req, res) => {
        const results = normalizeProviderResults(
            req.body.results
        );

        if (!results.length) {
            return res.status(400).json({
                success: false,
                message: "No valid provider results supplied"
            });
        }

        const imported = await ingestOffers(results);

        res.status(200).json({
            success: true,
            message: "Provider results imported successfully",
            data: {
                importedCount: imported.length,
                imported
            }
        });
    }
);

const refreshProviderPrices = asyncHandler(
    async (req, res) => {
        const result = await refreshPrices();

        res.status(200).json({
            success: true,
            message: "Price refresh completed",
            data: result
        });
    }
);

export {
    listProviders,
    searchProductsFromProvider,
    ingestProviderOffers,
    refreshProviderPrices
};
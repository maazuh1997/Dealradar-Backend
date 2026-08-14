import Offer from "../../models/Offer.js";
import Product from "../../models/Product.js";
import PriceHistory from "../../models/PriceHistory.js";
import processPriceAlert from "./priceAlert.service.js";
import {
    getProvider
} from "../providers/providerManager.js";
import {
    normalizeProviderResult
} from "../providers/normalizeProviderResult.js";

const refreshOffer = async (offer) => {
    if (!offer.provider || offer.provider === "manual") {
        return {
            status: "skipped",
            reason: "Provider does not support automatic refresh"
        };
    }

    const provider = getProvider(offer.provider);

    if (!provider.getProduct) {
        return {
            status: "skipped",
            reason: "Provider does not support product refresh"
        };
    }

    const product = await Product.findById(
        offer.product
    ).lean();

    if (!product) {
        return {
            status: "skipped",
            reason: "Product not found"
        };
    }

    const externalId =
        product.metadata?.externalId;

    if (!externalId) {
        return {
            status: "skipped",
            reason: "Provider external ID is missing"
        };
    }

    const result = await provider.getProduct({
        externalId
    });

    const providerOffers =
        Array.isArray(result?.offers)
            ? result.offers
            : [];

    const matchingOffer = providerOffers.find(
        (item) =>
            item.merchant?.toLowerCase() ===
            offer.merchant.toLowerCase()
    );

    if (!matchingOffer) {
        return {
            status: "skipped",
            reason: "Matching provider offer not found"
        };
    }

    const normalized =
        normalizeProviderResult({
            ...matchingOffer,
            provider: offer.provider
        });

    if (!normalized) {
        return {
            status: "skipped",
            reason: "Invalid provider result"
        };
    }

    const previousPrice = offer.price;

    offer.title = normalized.title;
    offer.url = normalized.url;
    offer.affiliateUrl =
        normalized.affiliateUrl;
    offer.price = normalized.price;
    offer.originalPrice =
        normalized.originalPrice;
    offer.currency = normalized.currency;
    offer.availability =
        normalized.availability;
    offer.shippingCost =
        normalized.shippingCost;
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

    return {
        status:
            previousPrice === offer.price
                ? "unchanged"
                : "updated",
        previousPrice,
        currentPrice: offer.price,
        offerId: offer._id
    };
};

const refreshPrices = async () => {
    const offers = await Offer.find({
        provider: {
            $ne: "manual"
        }
    });

    const results = [];

    for (const offer of offers) {
        try {
            const result = await refreshOffer(offer);

            results.push({
                offerId: offer._id,
                merchant: offer.merchant,
                ...result
            });
        } catch (error) {
            results.push({
                offerId: offer._id,
                merchant: offer.merchant,
                status: "failed",
                reason: error.message
            });
        }
    }

    return {
        total: offers.length,
        results
    };
};

export {
    refreshOffer,
    refreshPrices
};
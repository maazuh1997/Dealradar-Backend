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

const refreshOffer = async (
    offer
) => {
    if (
        !offer.provider ||
        offer.provider === "manual"
    ) {
        return {
            status:
                "skipped",
            reason:
                "Provider does not support automatic refresh"
        };
    }

    const provider =
        getProvider(
            offer.provider
        );

    if (
        !provider.getProduct
    ) {
        return {
            status:
                "skipped",
            reason:
                "Provider does not support product refresh"
        };
    }

    const product =
        await Product.findById(
            offer.product
        ).lean();

    if (!product) {
        return {
            status:
                "skipped",
            reason:
                "Product not found"
        };
    }

    const providerIdentity =
        Array.isArray(
            product.providerIds
        )
            ? product.providerIds.find(
                (item) =>
                    item.provider ===
                    offer.provider
            )
            : null;

    const externalId =
        providerIdentity?.externalId ||
        (
            product.metadata?.provider ===
                offer.provider
                ? product.metadata?.externalId
                : null
        );

    if (!externalId) {
        return {
            status:
                "skipped",
            reason:
                "Provider external ID is missing"
        };
    }

    const result =
        await provider.getProduct({
            externalId,
            query:
                product.metadata?.query ||
                product.title
        });

    const providerOffers =
        Array.isArray(
            result?.offers
        )
            ? result.offers
                .map(
                    (item) =>
                        normalizeProviderResult({
                            ...item,
                            title:
                                item.title ||
                                product.title,
                            image:
                                item.image ||
                                product.images?.[0] ||
                                null,
                            brand:
                                item.brand ||
                                product.brand ||
                                null,
                            category:
                                item.category ||
                                product.category ||
                                null,
                            provider:
                                offer.provider,
                            productExternalId:
                                externalId
                        })
                )
                .filter(Boolean)
            : [];

    const matchingOffer =
        providerOffers.find(
            (item) =>
                item.merchantKey ===
                offer.merchantKey
        ) ||
        providerOffers.find(
            (item) =>
                item.merchant?.toLowerCase() ===
                offer.merchant?.toLowerCase()
        );

    if (!matchingOffer) {
        return {
            status:
                "skipped",
            reason:
                "Matching provider offer not found"
        };
    }

    const previousPrice =
        offer.price;

    offer.merchant =
        matchingOffer.merchant;

    offer.merchantKey =
        matchingOffer.merchantKey;

    offer.title =
        matchingOffer.title;

    offer.url =
        matchingOffer.url;

    offer.affiliateUrl =
        matchingOffer.affiliateUrl;

    offer.price =
        matchingOffer.price;

    offer.originalPrice =
        matchingOffer.originalPrice;

    offer.currency =
        matchingOffer.currency;

    offer.availability =
        matchingOffer.availability;

    offer.shippingCost =
        matchingOffer.shippingCost;

    offer.lastChecked =
        new Date();

    await offer.save();

    if (
        previousPrice !==
        offer.price
    ) {
        await PriceHistory.create({
            product:
                offer.product,
            offer:
                offer._id,
            merchant:
                offer.merchant,
            price:
                offer.price,
            currency:
                offer.currency,
            recordedAt:
                new Date()
        });

        await processPriceAlert(
            offer
        );
    }

    return {
        status:
            previousPrice ===
                offer.price
                ? "unchanged"
                : "updated",
        previousPrice,
        currentPrice:
            offer.price,
        offerId:
            offer._id
    };
};

const refreshPrices =
    async () => {
        const offers =
            await Offer.find({
                provider: {
                    $ne:
                        "manual"
                }
            });

        const results = [];

        for (
            const offer of offers
        ) {
            try {
                const result =
                    await refreshOffer(
                        offer
                    );

                results.push({
                    offerId:
                        offer._id,
                    merchant:
                        offer.merchant,
                    ...result
                });
            } catch (
            error
            ) {
                results.push({
                    offerId:
                        offer._id,
                    merchant:
                        offer.merchant,
                    status:
                        "failed",
                    reason:
                        error.message
                });
            }
        }

        return {
            total:
                offers.length,
            results
        };
    };

export {
    refreshOffer,
    refreshPrices
};
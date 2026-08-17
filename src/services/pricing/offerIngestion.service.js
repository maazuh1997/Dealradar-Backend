import Offer from "../../models/Offer.js";
import PriceHistory from "../../models/PriceHistory.js";
import processPriceAlert from "./priceAlert.service.js";
import {
    getOrCreateCanonicalProduct
} from "../products/canonicalProduct.service.js";
import {
    getOrCreateCanonicalVariant
} from "../products/canonicalVariant.service.js";
import {
    getMerchantIdentity
} from "../merchants/merchantIdentity.service.js";

const ingestOffer = async (
    data
) => {
    if (
        !data?.title ||
        !data?.provider ||
        !data?.merchant ||
        !data?.url
    ) {
        throw new Error(
            "Invalid provider offer data"
        );
    }

    const merchantIdentity =
        getMerchantIdentity({
            merchant:
                data.merchant,
            merchantUrl:
                data.merchantUrl
        });

    const canonicalResult =
        await getOrCreateCanonicalProduct({
            product: {
                externalId:
                    data.productExternalId ||
                    data.externalId ||
                    null,
                provider:
                    data.provider,
                title:
                    data.title,
                brand:
                    data.brand ||
                    null,
                category:
                    data.category ||
                    null,
                description:
                    data.description ||
                    null,
                images:
                    data.image
                        ? [data.image]
                        : [],
                identifiers:
                    data.identifiers ||
                    {},
                specifications:
                    data.specifications ||
                    {},
                rating:
                    data.rating ||
                    0,
                reviewCount:
                    data.reviewCount ||
                    0,
                query:
                    data.query ||
                    data.title
            }
        });

    const product =
        canonicalResult.product;

    const variantResult =
        await getOrCreateCanonicalVariant({
            productId:
                product._id,
            title:
                data.title,
            attributes:
                data.attributes ||
                data.variant ||
                data.options ||
                {},
            identifiers:
                data.identifiers ||
                {},
            specifications:
                data.specifications ||
                {},
            images:
                data.image
                    ? [data.image]
                    : [],
            provider:
                data.provider,
            externalId:
                data.productExternalId ||
                data.externalId ||
                null
        });

    const variant =
        variantResult.variant;

    let offer =
        await Offer.findOne({
            product:
                product._id,
            variant:
                variant._id,
            merchantKey:
                merchantIdentity.key,
            provider:
                data.provider
        });

    if (!offer) {
        offer =
            await Offer.findOne({
                product:
                    product._id,
                variant:
                    null,
                merchantKey:
                    merchantIdentity.key,
                provider:
                    data.provider
            });

        if (offer) {
            offer.variant =
                variant._id;
        }
    }

    const previousPrice =
        offer?.price;

    if (!offer) {
        offer =
            await Offer.create({
                product:
                    product._id,
                variant:
                    variant._id,
                merchant:
                    merchantIdentity.canonicalName,
                merchantKey:
                    merchantIdentity.key,
                title:
                    data.title,
                url:
                    data.url,
                affiliateUrl:
                    data.affiliateUrl ||
                    data.url,
                price:
                    data.price,
                originalPrice:
                    data.originalPrice,
                currency:
                    data.currency,
                availability:
                    data.availability,
                shippingCost:
                    data.shippingCost,
                provider:
                    data.provider,
                lastChecked:
                    new Date()
            });
    } else {
        offer.merchant =
            merchantIdentity.canonicalName;

        offer.merchantKey =
            merchantIdentity.key;

        offer.title =
            data.title;

        offer.url =
            data.url;

        offer.affiliateUrl =
            data.affiliateUrl ||
            data.url;

        offer.price =
            data.price;

        offer.originalPrice =
            data.originalPrice;

        offer.currency =
            data.currency;

        offer.availability =
            data.availability;

        offer.shippingCost =
            data.shippingCost;

        offer.lastChecked =
            new Date();

        await offer.save();
    }

    if (
        previousPrice ===
        undefined ||
        previousPrice !==
        offer.price
    ) {
        await PriceHistory.create({
            product:
                product._id,
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
        product,
        variant,
        offer
    };
};

const ingestOffers =
    async (
        results
    ) => {
        const imported = [];

        for (
            const result of results
        ) {
            const importedOffer =
                await ingestOffer(
                    result
                );

            imported.push(
                importedOffer
            );
        }

        return imported;
    };

export {
    ingestOffer,
    ingestOffers
};
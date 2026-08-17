import Product from "../../models/Product.js";
import Offer from "../../models/Offer.js";
import PriceHistory from "../../models/PriceHistory.js";
import processPriceAlert from "./priceAlert.service.js";
import createSlug from "../../utils/createSlug.js";

const findOrCreateProduct = async (data) => {
    let product = null;

    if (data.externalId && data.provider) {
        product = await Product.findOne({
            "metadata.externalId": data.externalId,
            "metadata.provider": data.provider
        });
    }

    if (!product) {
        product = await Product.findOne({
            title: data.title,
            brand: data.brand || undefined
        });
    }

    if (product) {
        if (
            !product.metadata?.query &&
            data.title
        ) {
            product.metadata = {
                ...(product.metadata?.toObject
                    ? product.metadata.toObject()
                    : product.metadata),
                query:
                    data.query ||
                    data.title
            };

            await product.save();
        }

        return product;
    }

    const baseSlug = createSlug(data.title);

    let slug = baseSlug;
    let counter = 1;

    while (await Product.exists({ slug })) {
        slug = `${baseSlug}-${counter}`;
        counter += 1;
    }

    product = await Product.create({
        title: data.title,
        slug,
        brand: data.brand,
        category: data.category,
        images: data.image ? [data.image] : [],
        metadata: {
            externalId: data.externalId,
            provider: data.provider,
            query:
                data.query ||
                data.title
        }
    });

    return product;
};

const ingestOffer = async (data) => {
    const product = await findOrCreateProduct(data);

    let offer = await Offer.findOne({
        product: product._id,
        merchant: data.merchant,
        provider: data.provider
    });

    const previousPrice = offer?.price;

    if (!offer) {
        offer = await Offer.create({
            product: product._id,
            merchant: data.merchant,
            title: data.title,
            url: data.url,
            affiliateUrl: data.affiliateUrl,
            price: data.price,
            originalPrice: data.originalPrice,
            currency: data.currency,
            availability: data.availability,
            shippingCost: data.shippingCost,
            provider: data.provider,
            lastChecked: new Date()
        });
    } else {
        offer.title = data.title;
        offer.url = data.url;
        offer.affiliateUrl = data.affiliateUrl;
        offer.price = data.price;
        offer.originalPrice = data.originalPrice;
        offer.currency = data.currency;
        offer.availability = data.availability;
        offer.shippingCost = data.shippingCost;
        offer.lastChecked = new Date();

        await offer.save();
    }

    if (
        previousPrice === undefined ||
        previousPrice !== offer.price
    ) {
        await PriceHistory.create({
            product: product._id,
            offer: offer._id,
            merchant: offer.merchant,
            price: offer.price,
            currency: offer.currency,
            recordedAt: new Date()
        });

        await processPriceAlert(offer);
    }

    return {
        product,
        offer
    };
};

const ingestOffers = async (results) => {
    const imported = [];

    for (const result of results) {
        const importedOffer = await ingestOffer(result);

        imported.push(importedOffer);
    }

    return imported;
};

export {
    ingestOffer,
    ingestOffers
};
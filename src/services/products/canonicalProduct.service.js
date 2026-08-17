import Product from "../../models/Product.js";
import createSlug from "../../utils/createSlug.js";
import {
    buildProductIdentity,
    shouldUpgradeIdentity
} from "./productIdentity.service.js";

const findCanonicalProduct = async ({
    product
}) => {
    const identity =
        buildProductIdentity({
            title:
                product.title,
            brand:
                product.brand,
            category:
                product.category,
            identifiers:
                product.identifiers ||
                {},
            specifications:
                product.specifications ||
                {}
        });

    if (
        product.externalId &&
        product.provider
    ) {
        const providerProduct =
            await Product.findOne({
                $or: [
                    {
                        "metadata.externalId":
                            product.externalId,
                        "metadata.provider":
                            product.provider
                    },
                    {
                        providerIds: {
                            $elemMatch: {
                                provider:
                                    product.provider,
                                externalId:
                                    String(
                                        product.externalId
                                    )
                            }
                        }
                    }
                ]
            });

        if (providerProduct) {
            return {
                product:
                    providerProduct,
                identity,
                matchType:
                    "provider",
                confidence:
                    "very_high"
            };
        }
    }

    if (
        identity.identifiers.gtin ||
        identity.identifiers.ean ||
        identity.identifiers.upc
    ) {
        const identifierQueries = [];

        if (
            identity.identifiers.gtin
        ) {
            identifierQueries.push({
                "identifiers.gtin":
                    identity.identifiers.gtin
            });
        }

        if (
            identity.identifiers.ean
        ) {
            identifierQueries.push({
                "identifiers.ean":
                    identity.identifiers.ean
            });
        }

        if (
            identity.identifiers.upc
        ) {
            identifierQueries.push({
                "identifiers.upc":
                    identity.identifiers.upc
            });
        }

        const identifierProduct =
            await Product.findOne({
                $or:
                    identifierQueries
            });

        if (
            identifierProduct
        ) {
            return {
                product:
                    identifierProduct,
                identity,
                matchType:
                    "identifier",
                confidence:
                    "very_high"
            };
        }
    }

    if (
        identity.fingerprint
    ) {
        const fingerprintProduct =
            await Product.findOne({
                "identity.fingerprint":
                    identity.fingerprint
            });

        if (
            fingerprintProduct
        ) {
            return {
                product:
                    fingerprintProduct,
                identity,
                matchType:
                    "fingerprint",
                confidence:
                    identity.confidence
            };
        }
    }

    return {
        product: null,
        identity,
        matchType:
            "none",
        confidence:
            "none"
    };
};

const mergeProductIdentity = async ({
    product,
    incomingProduct,
    identity
}) => {
    let changed = false;

    if (
        !product.identity?.fingerprint
    ) {
        product.identity =
            identity;

        changed = true;
    } else if (
        shouldUpgradeIdentity(
            product.identity
                .confidence,
            identity.confidence
        )
    ) {
        product.identity =
            identity;

        changed = true;
    }

    if (
        !product.brand &&
        incomingProduct.brand
    ) {
        product.brand =
            incomingProduct.brand;

        changed = true;
    }

    if (
        !product.category &&
        incomingProduct.category
    ) {
        product.category =
            incomingProduct.category;

        changed = true;
    }

    if (
        !product.description &&
        incomingProduct.description
    ) {
        product.description =
            incomingProduct.description;

        changed = true;
    }

    if (
        incomingProduct.identifiers
    ) {
        const existingIdentifiers =
            product.identifiers ||
            {};

        const incomingIdentifiers =
            incomingProduct.identifiers;

        for (
            const [
                key,
                value
            ] of Object.entries(
                incomingIdentifiers
            )
        ) {
            if (
                value &&
                !existingIdentifiers[
                key
                ]
            ) {
                existingIdentifiers[
                    key
                ] = value;

                changed = true;
            }
        }

        product.identifiers =
            existingIdentifiers;
    }

    if (
        Array.isArray(
            incomingProduct.images
        )
    ) {
        const existingImages =
            Array.isArray(
                product.images
            )
                ? product.images
                : [];

        const images = [
            ...existingImages,
            ...incomingProduct.images
        ].filter(Boolean);

        const uniqueImages = [
            ...new Set(images)
        ];

        if (
            uniqueImages.length !==
            existingImages.length
        ) {
            product.images =
                uniqueImages.slice(
                    0,
                    10
                );

            changed = true;
        }
    }

    if (
        incomingProduct.externalId &&
        incomingProduct.provider
    ) {
        const providerIds =
            Array.isArray(
                product.providerIds
            )
                ? product.providerIds
                : [];

        const exists =
            providerIds.some(
                (item) =>
                    item.provider ===
                    incomingProduct.provider &&
                    String(
                        item.externalId
                    ) ===
                    String(
                        incomingProduct.externalId
                    )
            );

        if (!exists) {
            providerIds.push({
                provider:
                    incomingProduct.provider,
                externalId:
                    String(
                        incomingProduct.externalId
                    )
            });

            product.providerIds =
                providerIds;

            changed = true;
        }
    }

    if (
        changed
    ) {
        await product.save();
    }

    return product;
};

const getOrCreateCanonicalProduct =
    async ({
        product
    }) => {
        const result =
            await findCanonicalProduct({
                product
            });

        if (
            result.product
        ) {
            const merged =
                await mergeProductIdentity({
                    product:
                        result.product,
                    incomingProduct:
                        product,
                    identity:
                        result.identity
                });

            return {
                product:
                    merged,
                identity:
                    result.identity,
                matchType:
                    result.matchType,
                confidence:
                    result.confidence,
                created: false
            };
        }

        const baseSlug =
            createSlug(
                product.title
            );

        let slug =
            baseSlug;

        let counter = 1;

        while (
            await Product.exists({
                slug
            })
        ) {
            slug =
                `${baseSlug}-${counter}`;

            counter += 1;
        }

        const providerIds =
            product.externalId &&
                product.provider
                ? [
                    {
                        provider:
                            product.provider,
                        externalId:
                            String(
                                product.externalId
                            )
                    }
                ]
                : [];

        const created =
            await Product.create({
                title:
                    product.title,
                slug,
                brand:
                    product.brand ||
                    null,
                category:
                    product.category ||
                    null,
                description:
                    product.description ||
                    null,
                images:
                    product.images ||
                    [],
                identifiers:
                    product.identifiers ||
                    {},
                specifications:
                    product.specifications ||
                    {},
                rating:
                    product.rating ||
                    0,
                reviewCount:
                    product.reviewCount ||
                    0,
                identity:
                    result.identity,
                providerIds,
                metadata: {
                    externalId:
                        product.externalId ||
                        null,
                    provider:
                        product.provider ||
                        null,
                    query:
                        product.query ||
                        null
                }
            });

        return {
            product:
                created,
            identity:
                result.identity,
            matchType:
                "created",
            confidence:
                result.identity
                    .confidence,
            created: true
        };
    };

export {
    findCanonicalProduct,
    mergeProductIdentity,
    getOrCreateCanonicalProduct
};
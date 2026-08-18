import ProductVariant from "../../models/ProductVariant.js";
import createSlug from "../../utils/createSlug.js";
import {
    buildVariantIdentity
} from "./productVariantIdentity.service.js";

const identifierPriority = [
    "gtin",
    "ean",
    "upc",
    "sku",
    "mpn"
];

const confidenceRank = {
    low: 1,
    medium: 2,
    high: 3,
    very_high: 4
};

const findVariantByProviderId = async ({
    provider,
    externalId
}) => {
    if (
        !provider ||
        !externalId
    ) {
        return null;
    }

    return ProductVariant.findOne({
        providerIds: {
            $elemMatch: {
                provider,
                externalId:
                    String(
                        externalId
                    )
            }
        }
    });
};

const hasConflictingIdentifiers = ({
    variant,
    identifiers
}) => {
    for (
        const key of identifierPriority
    ) {
        const incomingValue =
            identifiers[key];

        const existingValue =
            variant.identifiers?.[key];

        if (
            incomingValue &&
            existingValue &&
            String(
                incomingValue
            ) !==
            String(
                existingValue
            )
        ) {
            return true;
        }
    }

    return false;
};

const findVariantByIdentifier = async ({
    productId,
    identifiers = {}
}) => {
    for (
        const key of identifierPriority
    ) {
        const value =
            identifiers[key];

        if (!value) {
            continue;
        }

        const variant =
            await ProductVariant.findOne({
                product:
                    productId,
                [`identifiers.${key}`]:
                    String(
                        value
                    )
            });

        if (!variant) {
            continue;
        }

        if (
            hasConflictingIdentifiers({
                variant,
                identifiers
            })
        ) {
            continue;
        }

        return variant;
    }

    return null;
};

const findVariantByFingerprint = async ({
    productId,
    fingerprint
}) => {
    if (
        !fingerprint
    ) {
        return null;
    }

    return ProductVariant.findOne({
        product:
            productId,
        fingerprint
    });
};

const addProviderId = ({
    variant,
    provider,
    externalId
}) => {
    if (
        !provider ||
        !externalId
    ) {
        return false;
    }

    const providerIds =
        Array.isArray(
            variant.providerIds
        )
            ? variant.providerIds
            : [];

    const existing =
        providerIds.find(
            (item) =>
                item.provider ===
                provider &&
                String(
                    item.externalId
                ) ===
                String(
                    externalId
                )
        );

    if (existing) {
        return false;
    }

    providerIds.push({
        provider,
        externalId:
            String(
                externalId
            )
    });

    variant.providerIds =
        providerIds;

    return true;
};

const updateIdentityMetadata = ({
    variant,
    confidence,
    sources
}) => {
    if (
        !confidence
    ) {
        return false;
    }

    const currentConfidence =
        variant.identity
            ?.confidence ||
        "medium";

    const currentRank =
        confidenceRank[
        currentConfidence
        ] || 2;

    const incomingRank =
        confidenceRank[
        confidence
        ] || 1;

    let changed = false;

    if (
        incomingRank >
        currentRank
    ) {
        variant.identity = {
            ...(variant.identity || {}),
            confidence,
            sources:
                sources || []
        };

        changed = true;
    } else if (
        !variant.identity
            ?.sources
            ?.length &&
        sources?.length
    ) {
        variant.identity = {
            ...(variant.identity || {}),
            confidence:
                currentConfidence,
            sources
        };

        changed = true;
    }

    return changed;
};

const createVariant = async ({
    productId,
    title,
    attributes,
    identifiers,
    specifications,
    images,
    provider,
    externalId,
    confidence,
    sources
}) => {
    const identity =
        buildVariantIdentity({
            attributes,
            identifiers,
            specifications
        });

    const baseSlug =
        createSlug(
            title
        );

    let slug =
        baseSlug;

    let counter = 1;

    while (
        await ProductVariant.exists({
            product:
                productId,
            slug
        })
    ) {
        slug =
            `${baseSlug}-${counter}`;

        counter += 1;
    }

    return ProductVariant.create({
        product:
            productId,
        title:
            title.trim(),
        slug,
        variantKey:
            identity.variantKey,
        fingerprint:
            identity.fingerprint,
        attributes:
            identity.attributes,
        identifiers:
            identity.identifiers,
        specifications:
            identity.specifications,
        images:
            images || [],
        identity: {
            confidence:
                confidence ||
                "medium",
            sources:
                sources || []
        },
        providerIds:
            provider &&
                externalId
                ? [
                    {
                        provider,
                        externalId:
                            String(
                                externalId
                            )
                    }
                ]
                : []
    });
};

const getOrCreateCanonicalVariant =
    async ({
        productId,
        title,
        attributes = {},
        identifiers = {},
        specifications = {},
        images = [],
        provider,
        externalId,
        confidence = "medium",
        sources = []
    }) => {
        if (!productId) {
            throw new Error(
                "Product ID is required"
            );
        }

        if (!title) {
            throw new Error(
                "Variant title is required"
            );
        }

        let variant =
            await findVariantByProviderId({
                provider,
                externalId
            });

        if (
            variant &&
            String(
                variant.product
            ) !==
            String(
                productId
            )
        ) {
            throw new Error(
                "Provider variant belongs to another product"
            );
        }

        const identity =
            buildVariantIdentity({
                attributes,
                identifiers,
                specifications
            });

        if (!variant) {
            variant =
                await findVariantByIdentifier({
                    productId,
                    identifiers:
                        identity.identifiers
                });
        }

        if (!variant) {
            variant =
                await findVariantByFingerprint({
                    productId,
                    fingerprint:
                        identity.fingerprint
                });
        }

        if (!variant) {
            variant =
                await createVariant({
                    productId,
                    title,
                    attributes:
                        identity.attributes,
                    identifiers:
                        identity.identifiers,
                    specifications:
                        identity.specifications,
                    images,
                    provider,
                    externalId,
                    confidence,
                    sources
                });

            return {
                variant,
                created:
                    true
            };
        }

        let changed =
            false;

        if (
            addProviderId({
                variant,
                provider,
                externalId
            })
        ) {
            changed = true;
        }

        if (
            updateIdentityMetadata({
                variant,
                confidence,
                sources
            })
        ) {
            changed = true;
        }

        if (
            images.length &&
            !variant.images?.length
        ) {
            variant.images =
                images;

            changed = true;
        }

        if (
            title &&
            variant.title !==
            title.trim()
        ) {
            variant.title =
                title.trim();

            changed = true;
        }

        if (changed) {
            await variant.save();
        }

        return {
            variant,
            created:
                false
        };
    };

export {
    findVariantByProviderId,
    findVariantByIdentifier,
    findVariantByFingerprint,
    getOrCreateCanonicalVariant
};
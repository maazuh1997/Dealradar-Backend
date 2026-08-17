import ProductVariant from "../../models/ProductVariant.js";
import createSlug from "../../utils/createSlug.js";
import {
    buildVariantIdentity
} from "./productVariantIdentity.service.js";

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

const findVariantByIdentifier = async ({
    productId,
    identifiers = {}
}) => {
    const queries = [];

    for (
        const key of [
            "gtin",
            "ean",
            "upc",
            "sku",
            "mpn"
        ]
    ) {
        const value =
            identifiers[key];

        if (value) {
            queries.push({
                [`identifiers.${key}`]:
                    String(
                        value
                    )
            });
        }
    }

    if (
        !queries.length
    ) {
        return null;
    }

    return ProductVariant.findOne({
        product:
            productId,
        $or:
            queries
    });
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
const createVariant = async ({
    productId,
    title,
    attributes,
    identifiers,
    specifications,
    images,
    provider,
    externalId
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
        externalId
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
                    externalId
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
            changed =
                true;
        }

        if (
            images.length &&
            !variant.images?.length
        ) {
            variant.images =
                images;

            changed =
                true;
        }

        if (
            title &&
            variant.title !==
            title.trim()
        ) {
            variant.title =
                title.trim();

            changed =
                true;
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
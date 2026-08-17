const normalizeVariantValue = (
    value
) => {
    return String(
        value || ""
    )
        .toLowerCase()
        .normalize("NFKD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /[^a-z0-9]+/g,
            " "
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();
};

const normalizeVariantAttributes = (
    attributes = {}
) => {
    return Object.entries(
        attributes
    )
        .filter(
            ([, value]) =>
                value !== null &&
                value !== undefined &&
                value !== ""
        )
        .map(
            ([key, value]) => [
                normalizeVariantValue(
                    key
                ),
                normalizeVariantValue(
                    value
                )
            ]
        )
        .filter(
            ([key, value]) =>
                key && value
        )
        .sort(
            ([firstKey], [secondKey]) =>
                firstKey.localeCompare(
                    secondKey
                )
        );
};

const normalizeVariantIdentifiers = (
    identifiers = {}
) => {
    const normalized = {};

    for (
        const key of [
            "sku",
            "upc",
            "ean",
            "gtin",
            "mpn"
        ]
    ) {
        if (
            identifiers[key]
        ) {
            normalized[key] =
                normalizeVariantValue(
                    identifiers[key]
                );
        }
    }

    return normalized;
};

const normalizeVariantSpecifications = (
    specifications = {}
) => {
    return Object.entries(
        specifications
    )
        .filter(
            ([, value]) =>
                value !== null &&
                value !== undefined &&
                value !== ""
        )
        .map(
            ([key, value]) => [
                normalizeVariantValue(
                    key
                ),
                normalizeVariantValue(
                    value
                )
            ]
        )
        .filter(
            ([key, value]) =>
                key && value
        )
        .sort(
            ([firstKey], [secondKey]) =>
                firstKey.localeCompare(
                    secondKey
                )
        );
};

const buildVariantKey = (
    attributes = {}
) => {
    const normalizedAttributes =
        normalizeVariantAttributes(
            attributes
        );

    if (
        !normalizedAttributes.length
    ) {
        return "default";
    }

    return normalizedAttributes
        .map(
            ([key, value]) =>
                `${key}:${value}`
        )
        .join("|");
};

const buildVariantIdentity = ({
    attributes = {},
    identifiers = {},
    specifications = {}
}) => {
    const normalizedAttributes =
        normalizeVariantAttributes(
            attributes
        );

    const normalizedIdentifiers =
        normalizeVariantIdentifiers(
            identifiers
        );

    const normalizedSpecifications =
        normalizeVariantSpecifications(
            specifications
        );

    const variantKey =
        normalizedAttributes.length
            ? normalizedAttributes
                .map(
                    ([key, value]) =>
                        `${key}:${value}`
                )
                .join("|")
            : "default";

    const identifierTokens =
        Object.entries(
            normalizedIdentifiers
        )
            .map(
                ([key, value]) =>
                    `${key}:${value}`
            );

    const specificationTokens =
        normalizedSpecifications.map(
            ([key, value]) =>
                `${key}:${value}`
        );

    const fingerprint = [
        variantKey,
        ...identifierTokens,
        ...specificationTokens
    ]
        .filter(Boolean)
        .join("|");

    return {
        variantKey,
        fingerprint:
            fingerprint ||
            "default",
        attributes:
            Object.fromEntries(
                normalizedAttributes
            ),
        identifiers:
            normalizedIdentifiers,
        specifications:
            Object.fromEntries(
                normalizedSpecifications
            )
    };
};

export {
    normalizeVariantValue,
    normalizeVariantAttributes,
    normalizeVariantIdentifiers,
    normalizeVariantSpecifications,
    buildVariantKey,
    buildVariantIdentity
};
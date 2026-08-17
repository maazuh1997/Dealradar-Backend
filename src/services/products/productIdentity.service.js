const normalizeText = (
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

const normalizeIdentifier = (
    value
) => {
    return String(
        value || ""
    )
        .toUpperCase()
        .replace(
            /[^A-Z0-9]/g,
            ""
        )
        .trim();
};

const normalizeBrand = (
    brand
) => {
    return normalizeText(
        brand
    );
};

const extractModel = (
    title,
    brand
) => {
    const normalizedTitle =
        normalizeText(
            title
        );

    const normalizedBrand =
        normalizeBrand(
            brand
        );

    if (
        !normalizedTitle
    ) {
        return "";
    }

    let model =
        normalizedTitle;

    if (
        normalizedBrand
    ) {
        model =
            model.replace(
                new RegExp(
                    `\\b${normalizedBrand.replace(
                        /[-/\\^$*+?.()|[\]{}]/g,
                        "\\$&"
                    )}\\b`,
                    "gi"
                ),
                " "
            );
    }

    const stopWords = new Set([
        "wireless",
        "headphones",
        "headphone",
        "earbuds",
        "earbud",
        "bluetooth",
        "speaker",
        "smartphone",
        "phone",
        "tablet",
        "laptop",
        "computer",
        "new",
        "latest",
        "official",
        "original",
        "unlocked",
        "global",
        "international",
        "black",
        "white",
        "blue",
        "red",
        "silver",
        "gold",
        "green"
    ]);

    model =
        model
            .split(" ")
            .filter(
                (token) =>
                    !stopWords.has(
                        token
                    )
            )
            .join(" ")
            .trim();

    return model;
};

const buildProductIdentity = ({
    title,
    brand,
    category,
    identifiers = {},
    specifications = {}
}) => {
    const normalizedTitle =
        normalizeText(
            title
        );

    const normalizedBrand =
        normalizeBrand(
            brand
        );

    const normalizedCategory =
        normalizeText(
            category
        );

    const normalizedIdentifiers = {
        sku:
            normalizeIdentifier(
                identifiers.sku
            ),
        upc:
            normalizeIdentifier(
                identifiers.upc
            ),
        ean:
            normalizeIdentifier(
                identifiers.ean
            ),
        gtin:
            normalizeIdentifier(
                identifiers.gtin
            )
    };

    const model =
        extractModel(
            title,
            brand
        );

    const identifier =
        normalizedIdentifiers.gtin ||
        normalizedIdentifiers.ean ||
        normalizedIdentifiers.upc ||
        "";

    let identityType =
        "title";

    let confidence =
        "medium";

    let fingerprintSource =
        normalizedBrand;

    if (
        identifier
    ) {
        identityType =
            "identifier";

        confidence =
            "very_high";

        fingerprintSource =
            `${normalizedBrand}|${identifier}`;
    } else if (
        normalizedBrand &&
        model
    ) {
        identityType =
            "brand_model";

        confidence =
            "high";

        fingerprintSource =
            `${normalizedBrand}|${model}`;
    } else {
        fingerprintSource =
            `${normalizedBrand}|${normalizedTitle}`;
    }

    const specificationTokens =
        Object.entries(
            specifications ||
            {}
        )
            .filter(
                ([key, value]) =>
                    value !==
                    null &&
                    value !==
                    undefined &&
                    value !==
                    ""
            )
            .map(
                ([key, value]) =>
                    `${normalizeText(
                        key
                    )}:${normalizeText(
                        value
                    )}`
            )
            .sort();

    const fingerprint =
        [
            fingerprintSource,
            normalizedCategory,
            ...specificationTokens
        ]
            .filter(Boolean)
            .join("|");

    return {
        normalizedTitle,
        normalizedBrand,
        normalizedCategory,
        model,
        identifiers:
            normalizedIdentifiers,
        identityType,
        confidence,
        fingerprint
    };
};

const compareProductIdentity = (
    first,
    second
) => {
    if (
        !first ||
        !second
    ) {
        return {
            score: 0,
            confidence:
                "none",
            matches: []
        };
    }

    const matches = [];
    let score = 0;

    const firstIds =
        first.identifiers ||
        {};

    const secondIds =
        second.identifiers ||
        {};

    const identifierTypes = [
        "gtin",
        "ean",
        "upc"
    ];

    for (
        const type of identifierTypes
    ) {
        if (
            firstIds[type] &&
            secondIds[type] &&
            firstIds[type] ===
            secondIds[type]
        ) {
            score += 100;

            matches.push(
                type
            );

            return {
                score: 100,
                confidence:
                    "very_high",
                matches
            };
        }
    }

    if (
        first.normalizedBrand &&
        second.normalizedBrand &&
        first.normalizedBrand ===
        second.normalizedBrand
    ) {
        score += 30;

        matches.push(
            "brand"
        );
    }

    if (
        first.model &&
        second.model &&
        first.model ===
        second.model
    ) {
        score += 50;

        matches.push(
            "model"
        );
    }

    if (
        first.normalizedTitle &&
        second.normalizedTitle &&
        first.normalizedTitle ===
        second.normalizedTitle
    ) {
        score += 20;

        matches.push(
            "title"
        );
    }

    if (
        first.normalizedCategory &&
        second.normalizedCategory &&
        first.normalizedCategory ===
        second.normalizedCategory
    ) {
        score += 10;

        matches.push(
            "category"
        );
    }

    let confidence =
        "low";

    if (
        score >= 80
    ) {
        confidence =
            "high";
    } else if (
        score >= 50
    ) {
        confidence =
            "medium";
    }

    return {
        score:
            Math.min(
                score,
                100
            ),
        confidence,
        matches
    };
};
const identityConfidenceRank = {
    low: 1,
    medium: 2,
    high: 3,
    very_high: 4
};

const shouldUpgradeIdentity = (
    existingConfidence,
    incomingConfidence
) => {
    return (
        (
            identityConfidenceRank[
            incomingConfidence
            ] || 0
        ) >
        (
            identityConfidenceRank[
            existingConfidence
            ] || 0
        )
    );
};

export {
    normalizeText,
    normalizeIdentifier,
    extractModel,
    buildProductIdentity,
    compareProductIdentity,
    shouldUpgradeIdentity
};
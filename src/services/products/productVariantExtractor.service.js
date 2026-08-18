const normalizeValue = (
    value
) => {
    if (
        value ===
        undefined ||
        value ===
        null
    ) {
        return null;
    }

    const normalized =
        String(value)
            .trim()
            .replace(
                /\s+/g,
                " "
            );

    return normalized ||
        null;
};

const normalizeKey = (
    key
) => {
    return String(key)
        .trim()
        .toLowerCase()
        .replace(
            /[\s_-]+/g,
            ""
        );
};

const variantKeyMap = {
    color: "color",
    colour: "color",
    storage: "storage",
    capacity: "capacity",
    memory: "ram",
    ram: "ram",
    size: "size",
    screen: "screenSize",
    screensize: "screenSize",
    display: "screenSize",
    generation: "generation",
    model: "model",
    variant: "variant",
    configuration:
        "configuration"
};

const extractExplicitAttributes = ({
    attributes = {},
    options = {},
    specifications = {}
}) => {
    const sources = [
        attributes,
        options,
        specifications
    ];

    const extracted = {};

    for (
        const source of sources
    ) {
        if (
            !source ||
            typeof source !==
            "object" ||
            Array.isArray(source)
        ) {
            continue;
        }

        for (
            const [
                rawKey,
                rawValue
            ] of Object.entries(
                source
            )
        ) {
            const key =
                variantKeyMap[
                normalizeKey(
                    rawKey
                )
                ];

            if (!key) {
                continue;
            }

            const value =
                normalizeValue(
                    rawValue
                );

            if (
                value &&
                !extracted[key]
            ) {
                extracted[key] =
                    value;
            }
        }
    }

    return extracted;
};

const extractStorage = (
    title
) => {
    const match =
        title.match(
            /\b(\d+(?:\.\d+)?\s?(?:TB|GB|MB))\b/i
        );

    return match
        ? match[1]
            .replace(
                /\s+/g,
                ""
            )
            .toUpperCase()
        : null;
};

const extractRam = (
    title
) => {
    const match =
        title.match(
            /\b(\d+(?:\.\d+)?\s?GB)\s?(?:RAM|Memory)\b/i
        );

    return match
        ? match[1]
            .replace(
                /\s+/g,
                ""
            )
            .toUpperCase()
        : null;
};

const extractSize = (
    title
) => {
    const match =
        title.match(
            /\b(\d+(?:\.\d+)?)\s?(?:inch|inches|")\b/i
        );

    return match
        ? `${match[1]}"`.trim()
        : null;
};

const extractGeneration = (
    title
) => {
    const match =
        title.match(
            /\b(?:gen(?:eration)?|series)\s?(\d+)\b/i
        );

    return match
        ? match[1]
        : null;
};

const extractColor = (
    title
) => {
    const colors = [
        "black",
        "white",
        "silver",
        "gold",
        "blue",
        "red",
        "green",
        "purple",
        "pink",
        "yellow",
        "orange",
        "gray",
        "grey",
        "brown",
        "beige",
        "midnight",
        "starlight",
        "natural",
        "titanium"
    ];

    const lowerTitle =
        title.toLowerCase();

    const found =
        colors.find(
            (color) =>
                new RegExp(
                    `\\b${color}\\b`,
                    "i"
                ).test(
                    lowerTitle
                )
        );

    return found
        ? found
        : null;
};

const extractFromTitle = (
    title
) => {
    const normalizedTitle =
        normalizeValue(
            title
        );

    if (
        !normalizedTitle
    ) {
        return {};
    }

    const attributes = {};

    const storage =
        extractStorage(
            normalizedTitle
        );

    if (storage) {
        attributes.storage =
            storage;
    }

    const ram =
        extractRam(
            normalizedTitle
        );

    if (
        ram &&
        !attributes.storage
    ) {
        attributes.ram =
            ram;
    }

    const size =
        extractSize(
            normalizedTitle
        );

    if (size) {
        attributes.size =
            size;
    }

    const generation =
        extractGeneration(
            normalizedTitle
        );

    if (generation) {
        attributes.generation =
            generation;
    }

    const color =
        extractColor(
            normalizedTitle
        );

    if (color) {
        attributes.color =
            color;
    }

    return attributes;
};

const calculateConfidence = ({
    explicitAttributes,
    titleAttributes
}) => {
    const explicitCount =
        Object.keys(
            explicitAttributes
        ).length;

    const titleCount =
        Object.keys(
            titleAttributes
        ).length;

    if (
        explicitCount >= 2
    ) {
        return "very_high";
    }

    if (
        explicitCount === 1
    ) {
        return "high";
    }

    if (
        titleCount >= 2
    ) {
        return "medium";
    }

    if (
        titleCount === 1
    ) {
        return "low";
    }

    return "low";
};

const extractVariantAttributes = ({
    title = "",
    attributes = {},
    options = {},
    specifications = {}
}) => {
    const explicitAttributes =
        extractExplicitAttributes({
            attributes,
            options,
            specifications
        });

    const titleAttributes =
        extractFromTitle(
            title
        );

    const merged = {
        ...titleAttributes,
        ...explicitAttributes
    };

    const confidence =
        calculateConfidence({
            explicitAttributes,
            titleAttributes
        });

    return {
        attributes:
            merged,
        confidence,
        sources: {
            explicit:
                Object.keys(
                    explicitAttributes
                ),
            title:
                Object.keys(
                    titleAttributes
                )
        }
    };
};

export {
    extractVariantAttributes
};
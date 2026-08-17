const normalizeMerchantName = (
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
            /^https?:\/\//,
            ""
        )
        .replace(
            /^www\./,
            ""
        )
        .replace(
            /\.(com|net|org|co|io)(\.[a-z]{2})?$/g,
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

const merchantAliases = {
    amazon:
        "amazon",
    amazoncom:
        "amazon",
    walmart:
        "walmart",
    walmartcom:
        "walmart",
    target:
        "target",
    bestbuy:
        "best buy",
    bestbuycom:
        "best buy",
    ebay:
        "ebay",
    ebaycom:
        "ebay",
    newegg:
        "newegg",
    bhphotovideo:
        "b&h photo",
    bhphoto:
        "b&h photo"
};

const getMerchantIdentity = ({
    merchant,
    merchantUrl
}) => {
    const normalizedName =
        normalizeMerchantName(
            merchant
        );

    const normalizedUrl =
        normalizeMerchantName(
            merchantUrl
        );

    const aliasKey =
        normalizedName.replace(
            /\s+/g,
            ""
        );

    const canonicalName =
        merchantAliases[
        aliasKey
        ] ||
        normalizedName;

    return {
        canonicalName,
        normalizedName,
        normalizedUrl,
        key:
            canonicalName
                .replace(
                    /[^a-z0-9]+/g,
                    "-"
                )
                .replace(
                    /^-|-$/g,
                    ""
                )
    };
};

export {
    normalizeMerchantName,
    getMerchantIdentity
};
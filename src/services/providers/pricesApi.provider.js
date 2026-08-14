import env from "../../config/env.js";

const request = async ({
    query,
    country,
    limit,
    offersLimit
}) => {
    if (!env.pricesApi.key) {
        throw new Error(
            "PRICES_API_KEY is not configured"
        );
    }

    const params =
        new URLSearchParams({
            q: query,
            country:
                country ||
                env.pricesApi.country,
            limit: String(
                Math.min(
                    Math.max(
                        Number(limit) || 5,
                        1
                    ),
                    5
                )
            ),
            offers_limit: String(
                Math.min(
                    Math.max(
                        Number(offersLimit) ||
                        10,
                        1
                    ),
                    20
                )
            )
        });

    const controller =
        new AbortController();

    const timeout = setTimeout(
        () => controller.abort(),
        env.pricesApi.timeout
    );

    try {
        const response = await fetch(
            `${env.pricesApi.baseUrl}/products/search?${params}`,
            {
                method: "GET",
                headers: {
                    Authorization:
                        `Bearer ${env.pricesApi.key}`,
                    Accept:
                        "application/json"
                },
                signal:
                    controller.signal
            }
        );

        const data =
            await response.json();

        if (!response.ok) {
            const error =
                new Error(
                    data?.error?.message ||
                    `PricesAPI request failed with status ${response.status}`
                );

            error.statusCode =
                response.status;

            error.providerError =
                data?.error;

            error.retryAfter =
                response.headers.get(
                    "Retry-After"
                );

            throw error;
        }

        return data;
    } finally {
        clearTimeout(timeout);
    }
};

const mapOffer = ({
    offer,
    product
}) => {
    if (
        !offer?.seller ||
        offer.price === undefined ||
        !offer.url
    ) {
        return null;
    }

    return {
        externalId:
            `${product.pid}-${offer.seller}`,
        title:
            product.title,
        merchant:
            offer.seller,
        merchantUrl:
            offer.seller_url ||
            null,
        url:
            offer.url,
        affiliateUrl:
            offer.url,
        price:
            Number(offer.price),
        originalPrice:
            undefined,
        currency:
            offer.currency ||
            product.currency ||
            "USD",
        availability:
            offer.condition
                ?.toLowerCase() ===
                "new"
                ? "in_stock"
                : "unknown",
        shippingCost:
            offer.shipping === null ||
                offer.shipping === undefined
                ? 0
                : Number(offer.shipping),
        condition:
            offer.condition ||
            null,
        image:
            product.image ||
            null,
        brand:
            null,
        category:
            null,
        provider:
            "pricesapi",
        productExternalId:
            String(product.pid)
    };
};

const mapProduct = ({
    product
}) => {
    const offers =
        Array.isArray(
            product.offers
        )
            ? product.offers
                .map((offer) =>
                    mapOffer({
                        offer,
                        product
                    })
                )
                .filter(Boolean)
            : [];

    return {
        externalId:
            String(product.pid),
        title:
            product.title,
        image:
            product.image ||
            null,
        merchant:
            product.source ||
            offers[0]?.merchant ||
            "Unknown",
        url:
            offers[0]?.url ||
            "",
        affiliateUrl:
            offers[0]?.affiliateUrl ||
            "",
        price:
            Number(product.price) ||
            offers[0]?.price ||
            0,
        currency:
            product.currency ||
            offers[0]?.currency ||
            "USD",
        rating:
            Number(product.rating) ||
            0,
        reviewCount:
            Number(product.reviews) ||
            0,
        condition:
            product.condition ||
            null,
        delivery:
            product.delivery ||
            null,
        offerCount:
            Number(product.offerCount) ||
            offers.length,
        offers
    };
};

const pricesApiProvider = {
    name: "pricesapi",

    search: async ({
        query,
        country,
        page = 1,
        limit = 5
    }) => {
        if (Number(page) !== 1) {
            return {
                products: [],
                provider:
                    "pricesapi",
                message:
                    "PricesAPI currently supports page 1 only"
            };
        }

        const result =
            await request({
                query,
                country,
                limit,
                offersLimit:
                    env.pricesApi
                        .offersLimit
            });

        const products =
            Array.isArray(
                result?.data
                    ?.products
            )
                ? result.data.products
                    .map(
                        (product) =>
                            mapProduct({
                                product
                            })
                    )
                : [];

        return {
            products,
            meta:
                result?.meta ||
                {},
            country:
                result?.data?.country ||
                country ||
                env.pricesApi
                    .country
        };
    },

    getProduct: async ({
        externalId
    }) => {
        const result =
            await request({
                query: externalId,
                country:
                    env.pricesApi
                        .country,
                limit: 5,
                offersLimit:
                    env.pricesApi
                        .offersLimit
            });

        const products =
            Array.isArray(
                result?.data
                    ?.products
            )
                ? result.data.products
                : [];

        const product =
            products.find(
                (item) =>
                    String(item.pid) ===
                    String(externalId)
            ) ||
            products[0];

        if (!product) {
            return {
                provider:
                    "pricesapi",
                externalId,
                offers: []
            };
        }

        const mapped =
            mapProduct({
                product
            });

        return {
            provider:
                "pricesapi",
            externalId,
            offers:
                mapped.offers || []
        };
    }
};

export default pricesApiProvider;
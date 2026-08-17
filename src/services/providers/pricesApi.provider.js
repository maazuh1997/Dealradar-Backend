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
                        Number(limit) || 3,
                        1
                    ),
                    5
                )
            ),
            offers_limit: String(
                Math.min(
                    Math.max(
                        Number(offersLimit) || 3,
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
            `${env.pricesApi.baseUrl}/products/search?${params.toString()}`,
            {
                method: "GET",
                headers: {
                    Authorization:
                        `Bearer ${env.pricesApi.key}`,
                    Accept:
                        "application/json",
                    "User-Agent":
                        "DealRadar/1.0"
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
    } catch (error) {
        if (
            error?.name ===
            "AbortError"
        ) {
            const timeoutError =
                new Error(
                    `PricesAPI request timed out after ${env.pricesApi.timeout}ms`
                );

            timeoutError.statusCode =
                504;

            timeoutError.code =
                "PRICES_API_TIMEOUT";

            throw timeoutError;
        }

        throw error;
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

    const price =
        Number(
            offer.price
        );

    const shippingCost =
        offer.shipping === null ||
            offer.shipping === undefined
            ? 0
            : Number(
                offer.shipping
            );

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
        price,
        totalPrice:
            price +
            shippingCost,
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
        shippingCost,
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
                .map(
                    (offer) =>
                        mapOffer({
                            offer,
                            product
                        })
                )
                .filter(Boolean)
            : [];

    const bestOffer =
        offers.length > 0
            ? offers.reduce(
                (
                    best,
                    offer
                ) => {
                    if (
                        !best ||
                        offer.totalPrice <
                        best.totalPrice
                    ) {
                        return offer;
                    }

                    return best;
                },
                null
            )
            : null;

    const productPrice =
        Number(
            product.price
        );

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
            bestOffer?.merchant ||
            "Unknown",
        url:
            bestOffer?.url ||
            "",
        affiliateUrl:
            bestOffer?.affiliateUrl ||
            "",
        price:
            Number.isFinite(
                productPrice
            )
                ? productPrice
                : bestOffer?.price ||
                0,
        currency:
            product.currency ||
            bestOffer?.currency ||
            "USD",
        rating:
            Number(
                product.rating
            ) || 0,
        reviewCount:
            Number(
                product.reviews
            ) || 0,
        condition:
            product.condition ||
            null,
        delivery:
            product.delivery ||
            null,
        offerCount:
            Number(
                product.offerCount
            ) ||
            offers.length,
        offers,
        bestOffer
    };
};

const pricesApiProvider = {
    name: "pricesapi",

    search: async ({
        query,
        country,
        page = 1,
        limit = 3
    }) => {
        if (
            Number(page) !==
            1
        ) {
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

        const rawProducts =
            result?.data
                ?.products;

        const products =
            Array.isArray(
                rawProducts
            )
                ? rawProducts
                    .map(
                        (product) =>
                            mapProduct({
                                product
                            })
                    )
                    .filter(Boolean)
                : [];

        return {
            products,
            meta:
                result?.meta || {},
            country:
                result?.data
                    ?.country ||
                country ||
                env.pricesApi
                    .country,
            provider:
                "pricesapi",
            degraded:
                result?.meta
                    ?.degraded ===
                true
        };
    },

    getProduct: async ({
        externalId,
        query
    }) => {
        const searchQuery =
            query?.trim() ||
            externalId;

        const result =
            await request({
                query:
                    searchQuery,
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
                ? result.data
                    .products
                : [];

        const product =
            products.find(
                (item) =>
                    String(item.pid) ===
                    String(externalId)
            );

        if (!product) {
            return {
                provider:
                    "pricesapi",
                externalId,
                product: null,
                offers: [],
                error:
                    "PricesAPI product ID was not found",
                query:
                    searchQuery
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
            product: mapped,
            offers:
                mapped.offers || [],
            query:
                searchQuery
        };
    }
};

export default pricesApiProvider;
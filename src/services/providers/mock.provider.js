const products = [
    {
        externalId: "demo-sony-wh1000xm6",
        title: "Sony WH-1000XM6",
        brand: "Sony",
        category: "Headphones",
        image:
            "https://example.com/sony-wh1000xm6.jpg"
    }
];

const offers = [
    {
        externalId: "demo-sony-wh1000xm6-amazon",
        productExternalId:
            "demo-sony-wh1000xm6",
        title: "Sony WH-1000XM6",
        merchant: "Amazon",
        url:
            "https://example.com/sony-amazon",
        affiliateUrl:
            "https://example.com/affiliate/sony-amazon",
        price: 389,
        originalPrice: 449,
        currency: "USD",
        availability: "in_stock",
        shippingCost: 0
    }
];

const mockProvider = {
    name: "mock",

    search: async ({ query }) => {
        const normalizedQuery =
            query.toLowerCase();

        const matchedProducts =
            products.filter((product) =>
                product.title
                    .toLowerCase()
                    .includes(normalizedQuery)
            );

        return {
            products: matchedProducts.map(
                (product) => ({
                    ...product,
                    merchant: "Amazon",
                    url:
                        "https://example.com/sony-amazon",
                    price: 389,
                    originalPrice: 449,
                    currency: "USD",
                    availability: "in_stock",
                    shippingCost: 0,
                    provider: "mock"
                })
            )
        };
    },

    getProduct: async ({
        externalId
    }) => {
        const productOffers =
            offers.filter(
                (offer) =>
                    offer.productExternalId ===
                    externalId
            );

        return {
            provider: "mock",
            externalId,
            offers: productOffers
        };
    }
};

export default mockProvider;
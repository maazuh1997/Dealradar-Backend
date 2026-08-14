const manualProvider = {
    name: "manual",

    search: async ({ query }) => {
        return {
            provider: "manual",
            query,
            products: []
        };
    },

    getProduct: async ({ externalId }) => {
        return {
            provider: "manual",
            externalId,
            product: null,
            offers: []
        };
    }
};

export default manualProvider;
const providerInterface = {
    name: "",
    search: async () => {
        throw new Error("Provider search is not implemented");
    },
    getProduct: async () => {
        throw new Error("Provider getProduct is not implemented");
    }
};

export default providerInterface;
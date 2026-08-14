import manualProvider from "./manual.provider.js";
import mockProvider from "./mock.provider.js";
import pricesApiProvider from "./pricesApi.provider.js";

const providers = new Map();

const registerProvider = (provider) => {
    if (!provider?.name) {
        throw new Error("Provider name is required");
    }

    providers.set(provider.name, provider);
};

const getProvider = (name) => {
    const provider = providers.get(name);

    if (!provider) {
        throw new Error(
            `Provider "${name}" is not registered`
        );
    }

    return provider;
};

const getProviders = () => {
    return Array.from(
        providers.values()
    ).map((provider) => provider.name);
};

registerProvider(manualProvider);
registerProvider(mockProvider);
registerProvider(pricesApiProvider);

export {
    registerProvider,
    getProvider,
    getProviders
};
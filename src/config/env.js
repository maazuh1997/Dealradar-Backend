import dotenv from "dotenv";

dotenv.config();

const env = {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || "development",
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
    clientUrl:
        process.env.CLIENT_URL ||
        "http://localhost:3000",
    priceRefreshCron:
        process.env.PRICE_REFRESH_CRON ||
        "*/30 * * * *",
    pricesApi: {
        key: process.env.PRICES_API_KEY,
        baseUrl:
            process.env.PRICES_API_BASE_URL ||
            "https://api.pricesapi.io/api/v1",
        country:
            process.env.PRICES_API_COUNTRY || "us",
        limit: Number(
            process.env.PRICES_API_LIMIT || 5
        ),
        offersLimit: Number(
            process.env.PRICES_API_OFFERS_LIMIT || 10
        ),
        timeout: Number(
            process.env.PRICES_API_TIMEOUT || 95000
        )
    }
};

if (!env.mongoUri) {
    throw new Error("MONGO_URI is required");
}

if (!env.jwtSecret) {
    throw new Error("JWT_SECRET is required");
}

export default env;
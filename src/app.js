import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import env from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import offerRoutes from "./routes/offer.routes.js";
import priceHistoryRoutes from "./routes/priceHistory.routes.js";
import watchlistRoutes from "./routes/watchlist.routes.js";
import priceAlertRoutes from "./routes/priceAlert.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import providerRoutes from "./routes/provider.routes.js";
import searchRoutes from "./routes/search.routes.js";
import trackedProductRoutes from "./routes/trackedProduct.routes.js";
import errorMiddleware from "./middleware/error.middleware.js";

const app = express();

app.use(
    cors({
        origin: env.clientUrl,
        credentials: true
    })
);

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (env.nodeEnv === "development") {
    app.use(morgan("dev"));
}

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "DealRadar API is running"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/price-history", priceHistoryRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/alerts", priceAlertRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/tracked-products", trackedProductRoutes);

app.use(errorMiddleware);

export default app;
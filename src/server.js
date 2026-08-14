import app from "./app.js";
import connectDB from "./config/db.js";
import env from "./config/env.js";
import {
    startPriceRefreshJob
} from "./services/jobs/priceRefresh.job.js";

const startServer = async () => {
    await connectDB();

    const server = app.listen(
        env.port,
        () => {
            console.log(
                `DealRadar API running on port ${env.port}`
            );

            startPriceRefreshJob();
        }
    );

    server.on("error", (error) => {
        console.error(
            `DealRadar API failed to start on port ${env.port}:`,
            error.message
        );

        process.exit(1);
    });
};

startServer();
import cron from "node-cron";
import env from "../../config/env.js";
import {
    refreshPrices
} from "../pricing/priceRefresh.service.js";

let isRunning = false;

const runPriceRefresh = async () => {
    if (isRunning) {
        return;
    }

    isRunning = true;

    try {
        console.log("Starting DealRadar price refresh");

        const result = await refreshPrices();

        console.log(
            `Price refresh completed: ${result.total} offers processed`
        );
    } catch (error) {
        console.error(
            "Price refresh failed:",
            error.message
        );
    } finally {
        isRunning = false;
    }
};

const startPriceRefreshJob = () => {
    const cronExpression =
        env.priceRefreshCron ||
        "*/30 * * * *";

    if (!cron.validate(cronExpression)) {
        throw new Error(
            `Invalid PRICE_REFRESH_CRON: ${cronExpression}`
        );
    }

    cron.schedule(
        cronExpression,
        runPriceRefresh
    );

    console.log(
        `Price refresh job scheduled: ${cronExpression}`
    );
};

export {
    startPriceRefreshJob,
    runPriceRefresh
};
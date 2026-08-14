const calculateAverage = (prices) => {
    if (!prices.length) {
        return 0;
    }

    const total = prices.reduce((sum, price) => sum + price, 0);

    return total / prices.length;
};

const calculateDealScore = ({
    currentPrice,
    originalPrice,
    lowestPrice,
    averagePrice,
    merchantCount,
    historyCount = 0
}) => {
    if (!currentPrice || currentPrice <= 0) {
        return {
            score: 0,
            label: "Unknown"
        };
    }

    let score = 50;

    if (averagePrice > currentPrice) {
        const savingsFromAverage =
            ((averagePrice - currentPrice) / averagePrice) * 100;

        score += Math.min(savingsFromAverage * 1.5, 25);
    } else {
        const aboveAverage =
            ((currentPrice - averagePrice) / averagePrice) * 100;

        score -= Math.min(aboveAverage * 1.5, 20);
    }

    if (lowestPrice > 0) {
        if (currentPrice <= lowestPrice) {
            score += 20;
        } else {
            const distanceFromLowest =
                ((currentPrice - lowestPrice) / lowestPrice) * 100;

            score -= Math.min(distanceFromLowest, 15);
        }
    }

    if (originalPrice && originalPrice > currentPrice) {
        const discount =
            ((originalPrice - currentPrice) / originalPrice) * 100;

        score += Math.min(discount * 0.5, 10);
    }

    if (merchantCount >= 3) {
        score += 3;
    }

    if (merchantCount >= 5) {
        score += 2;
    }

    score = Math.round(Math.max(0, Math.min(score, 100)));

    let label = "Poor";

    if (score >= 85) {
        label = "Excellent";
    } else if (score >= 70) {
        label = "Good";
    } else if (score >= 50) {
        label = "Fair";
    }

    let confidence = "low";

    if (historyCount >= 10) {
        confidence = "medium";
    }

    if (historyCount >= 30) {
        confidence = "high";
    }

    return {
        score,
        label,
        confidence
    };
};

const calculatePriceStats = (history) => {
    const prices = history
        .map((item) => Number(item.price))
        .filter((price) => price > 0);

    if (!prices.length) {
        return {
            lowestPrice: 0,
            highestPrice: 0,
            averagePrice: 0
        };
    }

    return {
        lowestPrice: Math.min(...prices),
        highestPrice: Math.max(...prices),
        averagePrice: Number(
            calculateAverage(prices).toFixed(2)
        )
    };
};

export {
    calculateDealScore,
    calculatePriceStats,
    calculateAverage
};
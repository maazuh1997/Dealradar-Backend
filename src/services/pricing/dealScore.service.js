const calculateAverage = (
    prices
) => {
    if (!prices.length) {
        return 0;
    }

    const total =
        prices.reduce(
            (
                sum,
                price
            ) =>
                sum + price,
            0
        );

    return total / prices.length;
};

const round = (
    value,
    decimals = 2
) => {
    if (
        !Number.isFinite(
            value
        )
    ) {
        return 0;
    }

    const factor =
        10 ** decimals;

    return Math.round(
        value * factor
    ) / factor;
};

const calculatePercentage = (
    from,
    to
) => {
    if (
        !Number.isFinite(from) ||
        from === 0 ||
        !Number.isFinite(to)
    ) {
        return 0;
    }

    return round(
        ((from - to) /
            from) *
        100
    );
};

const calculatePercentile = (
    prices,
    currentPrice
) => {
    if (
        !prices.length ||
        !Number.isFinite(
            currentPrice
        )
    ) {
        return null;
    }

    const sortedPrices =
        [...prices].sort(
            (a, b) =>
                a - b
        );

    const belowOrEqual =
        sortedPrices.filter(
            (price) =>
                price <=
                currentPrice
        ).length;

    return round(
        (belowOrEqual /
            sortedPrices.length) *
        100
    );
};

const calculateVolatility = (
    prices,
    averagePrice
) => {
    if (
        prices.length < 2 ||
        !averagePrice
    ) {
        return 0;
    }

    const variance =
        prices.reduce(
            (
                sum,
                price
            ) =>
                sum +
                Math.pow(
                    price -
                    averagePrice,
                    2
                ),
            0
        ) /
        prices.length;

    const standardDeviation =
        Math.sqrt(
            variance
        );

    return round(
        (
            standardDeviation /
            averagePrice
        ) *
        100
    );
};

const calculateTrend = (
    history
) => {
    if (
        !Array.isArray(
            history
        ) ||
        history.length < 4
    ) {
        return {
            direction:
                "unknown",
            percentage: 0,
            strength:
                "low"
        };
    }

    const sorted =
        [...history]
            .filter(
                (item) =>
                    Number(
                        item.price
                    ) > 0
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    new Date(
                        a.recordedAt
                    ) -
                    new Date(
                        b.recordedAt
                    )
            );

    if (
        sorted.length < 4
    ) {
        return {
            direction:
                "unknown",
            percentage: 0,
            strength:
                "low"
        };
    }

    const midpoint =
        Math.floor(
            sorted.length / 2
        );

    const firstHalf =
        sorted.slice(
            0,
            midpoint
        );

    const secondHalf =
        sorted.slice(
            midpoint
        );

    const firstAverage =
        calculateAverage(
            firstHalf.map(
                (item) =>
                    Number(
                        item.price
                    )
            )
        );

    const secondAverage =
        calculateAverage(
            secondHalf.map(
                (item) =>
                    Number(
                        item.price
                    )
            )
        );

    if (
        !firstAverage ||
        !secondAverage
    ) {
        return {
            direction:
                "unknown",
            percentage: 0,
            strength:
                "low"
        };
    }

    const percentage =
        round(
            (
                (
                    secondAverage -
                    firstAverage
                ) /
                firstAverage
            ) *
            100
        );

    const absolutePercentage =
        Math.abs(
            percentage
        );

    let direction =
        "stable";

    if (
        percentage <=
        -3
    ) {
        direction =
            "falling";
    } else if (
        percentage >=
        3
    ) {
        direction =
            "rising";
    }

    let strength =
        "low";

    if (
        absolutePercentage >=
        10
    ) {
        strength =
            "strong";
    } else if (
        absolutePercentage >=
        5
    ) {
        strength =
            "medium";
    }

    return {
        direction,
        percentage,
        strength
    };
};

const calculateConfidence = ({
    historyCount,
    merchantCount,
    hasHistoricalData
}) => {
    if (
        !hasHistoricalData
    ) {
        return "low";
    }

    let confidence =
        "low";

    if (
        historyCount >= 5
    ) {
        confidence =
            "medium";
    }

    if (
        historyCount >= 15
    ) {
        confidence =
            "high";
    }

    if (
        historyCount >= 30 &&
        merchantCount >= 3
    ) {
        confidence =
            "very_high";
    }

    return confidence;
};

const calculateRecommendation = ({
    currentPrice,
    lowestPrice,
    averagePrice,
    percentile,
    trend,
    historyCount
}) => {
    if (
        !currentPrice ||
        !averagePrice ||
        historyCount < 3
    ) {
        return {
            action:
                "unknown",
            label:
                "Not enough data",
            reason:
                "DealRadar needs more price history before making a reliable recommendation."
        };
    }

    const distanceFromLowest =
        lowestPrice > 0
            ? (
                (
                    currentPrice -
                    lowestPrice
                ) /
                lowestPrice
            ) *
            100
            : null;

    const savingsFromAverage =
        (
            (
                averagePrice -
                currentPrice
            ) /
            averagePrice
        ) *
        100;

    if (
        (
            percentile !== null &&
            percentile <= 20
        ) &&
        savingsFromAverage >=
        10
    ) {
        return {
            action:
                "buy",
            label:
                "Buy now",
            reason:
                "The current price is unusually low compared with DealRadar's historical prices."
        };
    }

    if (
        distanceFromLowest !==
        null &&
        distanceFromLowest <=
        5
    ) {
        return {
            action:
                "buy",
            label:
                "Strong buy",
            reason:
                "The current price is very close to the historical low."
        };
    }

    if (
        savingsFromAverage >=
        10 &&
        trend.direction !==
        "rising"
    ) {
        return {
            action:
                "buy",
            label:
                "Good time to buy",
            reason:
                "The current price is meaningfully below the historical average."
        };
    }

    if (
        savingsFromAverage <=
        -10 &&
        trend.direction ===
        "rising"
    ) {
        return {
            action:
                "wait",
            label:
                "Wait",
            reason:
                "The price is above its historical average and the recent trend is rising."
        };
    }

    if (
        savingsFromAverage <=
        -10
    ) {
        return {
            action:
                "wait",
            label:
                "Consider waiting",
            reason:
                "The current price is significantly above the historical average."
        };
    }

    return {
        action:
            "fair",
        label:
            "Fair price",
        reason:
            "The current price is within the normal historical range."
    };
};

const calculateDealScore = ({
    currentPrice,
    originalPrice = null,
    lowestPrice = 0,
    averagePrice = 0,
    merchantCount = 0,
    historyCount = 0
}) => {
    const current =
        Number(
            currentPrice
        ) || 0;

    if (
        current <= 0
    ) {
        return {
            score: 0,
            label: "Unknown",
            confidence: "low",
            reasons: []
        };
    }

    let score = 50;

    const reasons = [];

    if (
        averagePrice > 0
    ) {
        const difference =
            (
                (
                    averagePrice -
                    current
                ) /
                averagePrice
            ) * 100;

        if (
            difference >= 30
        ) {
            score += 30;

            reasons.push(
                "Far below historical average"
            );
        } else if (
            difference >= 20
        ) {
            score += 24;

            reasons.push(
                "Well below historical average"
            );
        } else if (
            difference >= 10
        ) {
            score += 16;

            reasons.push(
                "Below historical average"
            );
        } else if (
            difference >= 5
        ) {
            score += 8;
        } else if (
            difference <= -20
        ) {
            score -= 25;

            reasons.push(
                "Significantly above historical average"
            );
        } else if (
            difference <= -10
        ) {
            score -= 16;

            reasons.push(
                "Above historical average"
            );
        }
    }

    if (
        lowestPrice > 0
    ) {
        if (
            current <=
            lowestPrice
        ) {
            score += 20;

            reasons.push(
                "At historical low"
            );
        } else {
            const distance =
                (
                    (
                        current -
                        lowestPrice
                    ) /
                    lowestPrice
                ) * 100;

            if (
                distance <= 5
            ) {
                score += 12;

                reasons.push(
                    "Very close to historical low"
                );
            } else if (
                distance <= 10
            ) {
                score += 6;
            }
        }
    }

    if (
        originalPrice &&
        originalPrice >
        current
    ) {
        const discount =
            (
                (
                    originalPrice -
                    current
                ) /
                originalPrice
            ) * 100;

        if (
            discount >= 30
        ) {
            score += 10;

            reasons.push(
                `${Math.round(
                    discount
                )}% below listed price`
            );
        } else if (
            discount >= 15
        ) {
            score += 6;
        }
    }

    if (
        merchantCount >= 5
    ) {
        score += 5;
    } else if (
        merchantCount >= 3
    ) {
        score += 3;
    }

    score =
        Math.max(
            0,
            Math.min(
                100,
                Math.round(
                    score
                )
            )
        );

    let label =
        "Fair";

    if (
        score >= 85
    ) {
        label =
            "Excellent";
    } else if (
        score >= 70
    ) {
        label =
            "Good";
    } else if (
        score >= 50
    ) {
        label =
            "Fair";
    } else if (
        score >= 30
    ) {
        label =
            "Poor";
    } else {
        label =
            "Bad";
    }

    let confidence =
        "low";

    if (
        historyCount >= 30 &&
        merchantCount >= 3
    ) {
        confidence =
            "high";
    } else if (
        historyCount >= 10 ||
        merchantCount >= 3
    ) {
        confidence =
            "medium";
    }

    return {
        score,
        label,
        confidence,
        reasons
    };
};

const calculatePriceIntelligence = ({
    currentPrice,
    lowestPrice,
    highestPrice,
    averagePrice,
    history = [],
    merchantCount = 0
}) => {
    const historyPrices =
        history
            .map(
                (item) =>
                    Number(
                        item.price
                    )
            )
            .filter(
                (price) =>
                    Number.isFinite(
                        price
                    ) &&
                    price > 0
            );

    const historyCount =
        historyPrices.length;

    if (
        !currentPrice ||
        currentPrice <= 0
    ) {
        return {
            recommendation: {
                action:
                    "unknown",
                label:
                    "Not enough data",
                reason:
                    "A valid current price is required."
            },
            pricePosition: null,
            distanceFromLowest: null,
            savingsFromAverage: null,
            trend: {
                direction:
                    "unknown",
                percentage: 0,
                strength:
                    "low"
            },
            volatility: 0,
            confidence:
                "low",
            signals: []
        };
    }

    const pricePosition =
        calculatePercentile(
            historyPrices,
            currentPrice
        );

    const distanceFromLowest =
        lowestPrice > 0
            ? round(
                (
                    (
                        currentPrice -
                        lowestPrice
                    ) /
                    lowestPrice
                ) *
                100
            )
            : null;

    const savingsFromAverage =
        averagePrice > 0
            ? round(
                (
                    (
                        averagePrice -
                        currentPrice
                    ) /
                    averagePrice
                ) *
                100
            )
            : null;

    const trend =
        calculateTrend(
            history
        );

    const volatility =
        calculateVolatility(
            historyPrices,
            averagePrice
        );

    const recommendation =
        calculateRecommendation({
            currentPrice,
            lowestPrice,
            averagePrice,
            percentile:
                pricePosition,
            trend,
            historyCount
        });

    const confidence =
        calculateConfidence({
            historyCount,
            merchantCount,
            hasHistoricalData:
                historyCount > 0
        });

    const signals = [];

    if (
        pricePosition !==
        null &&
        pricePosition <=
        20
    ) {
        signals.push(
            "Current price is in the lower historical price range"
        );
    }

    if (
        savingsFromAverage !==
        null &&
        savingsFromAverage >=
        10
    ) {
        signals.push(
            `${savingsFromAverage}% below historical average`
        );
    }

    if (
        savingsFromAverage !==
        null &&
        savingsFromAverage <=
        -10
    ) {
        signals.push(
            `${Math.abs(
                savingsFromAverage
            )}% above historical average`
        );
    }

    if (
        distanceFromLowest !==
        null &&
        distanceFromLowest <=
        5
    ) {
        signals.push(
            "Very close to historical low"
        );
    }

    if (
        trend.direction ===
        "falling"
    ) {
        signals.push(
            "Recent prices are trending downward"
        );
    }

    if (
        trend.direction ===
        "rising"
    ) {
        signals.push(
            "Recent prices are trending upward"
        );
    }

    if (
        merchantCount >= 3
    ) {
        signals.push(
            `${merchantCount} merchants currently offer this product`
        );
    }

    if (
        volatility >=
        15
    ) {
        signals.push(
            "Price has historically been volatile"
        );
    }

    return {
        recommendation,
        pricePosition,
        distanceFromLowest,
        savingsFromAverage,
        trend,
        volatility,
        confidence,
        signals,
        historyCount,
        lowestPrice:
            lowestPrice || 0,
        highestPrice:
            highestPrice || 0,
        averagePrice:
            averagePrice || 0,
        currentPrice,
        merchantCount
    };
};

const calculatePriceStats = (
    history
) => {
    if (
        !Array.isArray(history) ||
        !history.length
    ) {
        return {
            lowestPrice: 0,
            highestPrice: 0,
            averagePrice: 0,
            medianPrice: 0,
            currentPrice: 0,
            historyCount: 0
        };
    }

    const prices =
        history
            .map(
                (item) =>
                    Number(
                        item.price
                    )
            )
            .filter(
                (price) =>
                    Number.isFinite(
                        price
                    ) &&
                    price > 0
            )
            .sort(
                (a, b) =>
                    a - b
            );

    if (!prices.length) {
        return {
            lowestPrice: 0,
            highestPrice: 0,
            averagePrice: 0,
            medianPrice: 0,
            currentPrice: 0,
            historyCount: 0
        };
    }

    const total =
        prices.reduce(
            (
                sum,
                price
            ) =>
                sum + price,
            0
        );

    const middle =
        Math.floor(
            prices.length / 2
        );

    const medianPrice =
        prices.length % 2 === 0
            ? (
                prices[
                middle - 1
                ] +
                prices[
                middle
                ]
            ) / 2
            : prices[middle];

    return {
        lowestPrice:
            prices[0],
        highestPrice:
            prices[
            prices.length - 1
            ],
        averagePrice:
            Number(
                (
                    total /
                    prices.length
                ).toFixed(2)
            ),
        medianPrice:
            Number(
                medianPrice.toFixed(
                    2
                )
            ),
        currentPrice:
            prices[
            prices.length - 1
            ],
        historyCount:
            prices.length
    };
};

const calculatePriceTrend = (
    history
) => {
    if (
        !Array.isArray(history) ||
        history.length < 2
    ) {
        return {
            direction: "unknown",
            percentage: 0,
            change: 0
        };
    }

    const sorted =
        [...history]
            .sort(
                (a, b) =>
                    new Date(
                        a.recordedAt
                    ) -
                    new Date(
                        b.recordedAt
                    )
            );

    const first =
        Number(
            sorted[0].price
        );

    const latest =
        Number(
            sorted[
                sorted.length - 1
            ].price
        );

    if (
        !Number.isFinite(
            first
        ) ||
        !Number.isFinite(
            latest
        ) ||
        first <= 0
    ) {
        return {
            direction: "unknown",
            percentage: 0,
            change: 0
        };
    }

    const change =
        latest - first;

    const percentage =
        Number(
            (
                (
                    change /
                    first
                ) * 100
            ).toFixed(2)
        );

    let direction =
        "stable";

    if (
        percentage > 2
    ) {
        direction =
            "up";
    } else if (
        percentage < -2
    ) {
        direction =
            "down";
    }

    return {
        direction,
        percentage,
        change:
            Number(
                change.toFixed(2)
            )
    };
};

const getBuyRecommendation = ({
    dealScore,
    trend,
    currentPrice,
    lowestPrice,
    averagePrice
}) => {
    if (
        !currentPrice
    ) {
        return {
            action: "unknown",
            reason:
                "Current price is unavailable"
        };
    }

    if (
        dealScore >= 85
    ) {
        return {
            action: "buy_now",
            reason:
                "Price is exceptionally attractive compared with historical prices"
        };
    }

    if (
        dealScore >= 70 &&
        trend?.direction !==
        "up"
    ) {
        return {
            action: "buy_now",
            reason:
                "Price is below its normal range and the trend is favorable"
        };
    }

    if (
        lowestPrice > 0 &&
        currentPrice <=
        lowestPrice * 1.05
    ) {
        return {
            action: "buy_now",
            reason:
                "Current price is within 5% of the historical low"
        };
    }

    if (
        averagePrice > 0 &&
        currentPrice >
        averagePrice * 1.1 &&
        trend?.direction ===
        "up"
    ) {
        return {
            action: "wait",
            reason:
                "Price is above average and currently trending upward"
        };
    }

    if (
        dealScore < 50
    ) {
        return {
            action: "wait",
            reason:
                "Current price is not particularly attractive"
        };
    }

    return {
        action: "watch",
        reason:
            "Price is reasonable but there is not enough evidence for a strong buy signal"
    };
};

export {
    calculateDealScore,
    calculatePriceStats,
    calculateAverage,
    calculatePriceIntelligence,
    calculatePriceTrend,
    getBuyRecommendation
};
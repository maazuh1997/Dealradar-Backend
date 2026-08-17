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

const getValidHistory = (
    history
) => {
    if (
        !Array.isArray(
            history
        )
    ) {
        return [];
    }

    return [...history]
        .map((item) => ({
            price:
                Number(
                    item.price
                ),
            recordedAt:
                new Date(
                    item.recordedAt
                )
        }))
        .filter(
            (item) =>
                Number.isFinite(
                    item.price
                ) &&
                item.price > 0 &&
                !Number.isNaN(
                    item.recordedAt.getTime()
                )
        )
        .sort(
            (a, b) =>
                a.recordedAt -
                b.recordedAt
        );
};

const calculateWeightedAverage = (
    prices
) => {
    if (!prices.length) {
        return 0;
    }

    let weightedTotal = 0;
    let weightTotal = 0;

    prices.forEach(
        (
            price,
            index
        ) => {
            const weight =
                index + 1;

            weightedTotal +=
                price *
                weight;

            weightTotal +=
                weight;
        }
    );

    return weightTotal
        ? weightedTotal /
        weightTotal
        : 0;
};

const calculateRegressionSlope = (
    prices
) => {
    if (
        prices.length < 2
    ) {
        return 0;
    }

    const n =
        prices.length;

    const xMean =
        (n - 1) / 2;

    const yMean =
        prices.reduce(
            (
                sum,
                price
            ) =>
                sum + price,
            0
        ) / n;

    let numerator = 0;
    let denominator = 0;

    prices.forEach(
        (
            price,
            index
        ) => {
            const x =
                index -
                xMean;

            numerator +=
                x *
                (price -
                    yMean);

            denominator +=
                x * x;
        }
    );

    if (!denominator) {
        return 0;
    }

    return (
        numerator /
        denominator
    );
};

const calculateStandardDeviation = (
    prices
) => {
    if (
        prices.length < 2
    ) {
        return 0;
    }

    const average =
        prices.reduce(
            (
                sum,
                price
            ) =>
                sum + price,
            0
        ) / prices.length;

    const variance =
        prices.reduce(
            (
                sum,
                price
            ) =>
                sum +
                Math.pow(
                    price -
                    average,
                    2
                ),
            0
        ) /
        prices.length;

    return Math.sqrt(
        variance
    );
};

const classifyDirection = (
    percentage
) => {
    if (
        percentage <=
        -3
    ) {
        return "falling";
    }

    if (
        percentage >=
        3
    ) {
        return "rising";
    }

    return "stable";
};

const calculateForecast = ({
    currentPrice,
    history = []
}) => {
    const validHistory =
        getValidHistory(
            history
        );

    if (
        !currentPrice ||
        currentPrice <= 0
    ) {
        return {
            status:
                "unavailable",
            confidence:
                "low",
            reason:
                "A valid current price is required."
        };
    }

    if (
        validHistory.length <
        5
    ) {
        return {
            status:
                "insufficient_data",
            confidence:
                "low",
            reason:
                "At least 5 historical price points are required.",
            historyCount:
                validHistory.length
        };
    }

    const prices =
        validHistory.map(
            (item) =>
                item.price
        );

    const recentPrices =
        prices.slice(
            -Math.min(
                prices.length,
                14
            )
        );

    const weightedAverage =
        calculateWeightedAverage(
            recentPrices
        );

    const slope =
        calculateRegressionSlope(
            recentPrices
        );

    const standardDeviation =
        calculateStandardDeviation(
            recentPrices
        );

    const recentFirst =
        recentPrices[0];

    const recentLast =
        recentPrices[
        recentPrices.length -
        1
        ];

    const recentChange =
        recentFirst
            ? (
                (
                    recentLast -
                    recentFirst
                ) /
                recentFirst
            ) *
            100
            : 0;

    const normalizedSlope =
        recentFirst
            ? (
                slope /
                recentFirst
            ) *
            100
            : 0;

    const direction =
        classifyDirection(
            recentChange
        );

    const volatility =
        weightedAverage
            ? (
                standardDeviation /
                weightedAverage
            ) *
            100
            : 0;

    const sevenDayMovement =
        slope * 7;

    const thirtyDayMovement =
        slope * 30;

    const forecast7Day =
        Math.max(
            0,
            currentPrice +
            sevenDayMovement
        );

    const forecast30Day =
        Math.max(
            0,
            currentPrice +
            thirtyDayMovement
        );

    const uncertainty7Day =
        Math.max(
            standardDeviation *
            0.75,
            currentPrice *
            0.02
        );

    const uncertainty30Day =
        Math.max(
            standardDeviation *
            1.5,
            currentPrice *
            0.05
        );

    const sevenDayLow =
        Math.max(
            0,
            forecast7Day -
            uncertainty7Day
        );

    const sevenDayHigh =
        forecast7Day +
        uncertainty7Day;

    const thirtyDayLow =
        Math.max(
            0,
            forecast30Day -
            uncertainty30Day
        );

    const thirtyDayHigh =
        forecast30Day +
        uncertainty30Day;

    let confidence =
        "low";

    if (
        validHistory.length >=
        10 &&
        volatility < 20
    ) {
        confidence =
            "medium";
    }

    if (
        validHistory.length >=
        20 &&
        volatility < 15
    ) {
        confidence =
            "high";
    }

    let outlook =
        "stable";

    if (
        direction ===
        "falling" &&
        normalizedSlope <
        -0.25
    ) {
        outlook =
            "likely_to_drop";
    } else if (
        direction ===
        "rising" &&
        normalizedSlope >
        0.25
    ) {
        outlook =
            "likely_to_rise";
    }

    const expectedChange7Day =
        currentPrice
            ? round(
                (
                    (
                        forecast7Day -
                        currentPrice
                    ) /
                    currentPrice
                ) *
                100
            )
            : 0;

    const expectedChange30Day =
        currentPrice
            ? round(
                (
                    (
                        forecast30Day -
                        currentPrice
                    ) /
                    currentPrice
                ) *
                100
            )
            : 0;

    return {
        status:
            "available",
        outlook,
        direction,
        confidence,
        historyCount:
            validHistory.length,
        currentPrice:
            round(
                currentPrice
            ),
        trend: {
            recentChange:
                round(
                    recentChange
                ),
            slope:
                round(
                    normalizedSlope,
                    4
                )
        },
        volatility:
            round(
                volatility
            ),
        weightedAverage:
            round(
                weightedAverage
            ),
        forecast: {
            sevenDay: {
                expected:
                    round(
                        forecast7Day
                    ),
                low:
                    round(
                        sevenDayLow
                    ),
                high:
                    round(
                        sevenDayHigh
                    ),
                expectedChange:
                    expectedChange7Day
            },
            thirtyDay: {
                expected:
                    round(
                        forecast30Day
                    ),
                low:
                    round(
                        thirtyDayLow
                    ),
                high:
                    round(
                        thirtyDayHigh
                    ),
                expectedChange:
                    expectedChange30Day
            }
        }
    };
};

export {
    calculateForecast
};
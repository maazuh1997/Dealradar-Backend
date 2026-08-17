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

const calculateAverage = (
    values
) => {
    if (!values.length) {
        return 0;
    }

    return (
        values.reduce(
            (
                sum,
                value
            ) =>
                sum + value,
            0
        ) /
        values.length
    );
};

const calculateWeightedAverage = (
    values
) => {
    if (!values.length) {
        return 0;
    }

    let total = 0;
    let weight = 0;

    values.forEach(
        (
            value,
            index
        ) => {
            const currentWeight =
                index + 1;

            total +=
                value *
                currentWeight;

            weight +=
                currentWeight;
        }
    );

    return weight
        ? total / weight
        : 0;
};

const calculateStandardDeviation = (
    values
) => {
    if (
        values.length < 2
    ) {
        return 0;
    }

    const average =
        calculateAverage(
            values
        );

    const variance =
        values.reduce(
            (
                sum,
                value
            ) =>
                sum +
                Math.pow(
                    value -
                    average,
                    2
                ),
            0
        ) /
        values.length;

    return Math.sqrt(
        variance
    );
};

const calculateTimeWeightedSlope = (
    history
) => {
    if (
        history.length < 2
    ) {
        return 0;
    }

    const firstDate =
        history[0]
            .recordedAt
            .getTime();

    const points =
        history.map(
            (item) => ({
                x:
                    (
                        item.recordedAt.getTime() -
                        firstDate
                    ) /
                    (
                        1000 *
                        60 *
                        60 *
                        24
                    ),
                y:
                    item.price
            })
        );

    const xMean =
        calculateAverage(
            points.map(
                (point) =>
                    point.x
            )
        );

    const yMean =
        calculateAverage(
            points.map(
                (point) =>
                    point.y
            )
        );

    let numerator = 0;
    let denominator = 0;

    points.forEach(
        (point) => {
            const x =
                point.x -
                xMean;

            numerator +=
                x *
                (
                    point.y -
                    yMean
                );

            denominator +=
                x * x;
        }
    );

    if (
        denominator === 0
    ) {
        return 0;
    }

    return (
        numerator /
        denominator
    );
};

const calculateRecentHistory = (
    history
) => {
    if (
        history.length <= 14
    ) {
        return history;
    }

    return history.slice(
        -14
    );
};

const classifyOutlook = (
    percentage
) => {
    if (
        percentage <=
        -3
    ) {
        return "likely_to_drop";
    }

    if (
        percentage >=
        3
    ) {
        return "likely_to_rise";
    }

    return "stable";
};

const calculateConfidence = ({
    historyCount,
    historyDays,
    volatility
}) => {
    if (
        historyCount < 5
    ) {
        return "low";
    }

    if (
        historyDays < 7
    ) {
        return "low";
    }

    if (
        historyCount >= 15 &&
        historyDays >= 30 &&
        volatility < 20
    ) {
        return "high";
    }

    return "medium";
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
                "DealRadar needs at least 5 historical price points.",
            historyCount:
                validHistory.length
        };
    }

    const firstDate =
        validHistory[0]
            .recordedAt;

    const lastDate =
        validHistory[
            validHistory.length -
            1
        ].recordedAt;

    const historyDays =
        Math.max(
            (
                lastDate -
                firstDate
            ) /
            (
                1000 *
                60 *
                60 *
                24
            ),
            0
        );

    const recentHistory =
        calculateRecentHistory(
            validHistory
        );

    const recentPrices =
        recentHistory.map(
            (item) =>
                item.price
        );

    const weightedAverage =
        calculateWeightedAverage(
            recentPrices
        );

    const standardDeviation =
        calculateStandardDeviation(
            recentPrices
        );

    const volatility =
        weightedAverage
            ? (
                standardDeviation /
                weightedAverage
            ) *
            100
            : 0;

    const slopePerDay =
        calculateTimeWeightedSlope(
            recentHistory
        );

    const recentStart =
        recentHistory[0]
            ?.price ||
        currentPrice;

    const recentEnd =
        recentHistory[
            recentHistory.length -
            1
        ]?.price ||
        currentPrice;

    const recentChange =
        recentStart
            ? (
                (
                    recentEnd -
                    recentStart
                ) /
                recentStart
            ) *
            100
            : 0;

    const forecast7Day =
        Math.max(
            0,
            currentPrice +
            slopePerDay *
            7
        );

    const forecast30Day =
        Math.max(
            0,
            currentPrice +
            slopePerDay *
            30
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

    const expectedChange7Day =
        (
            (
                forecast7Day -
                currentPrice
            ) /
            currentPrice
        ) *
        100;

    const expectedChange30Day =
        (
            (
                forecast30Day -
                currentPrice
            ) /
            currentPrice
        ) *
        100;

    const outlook =
        classifyOutlook(
            expectedChange7Day
        );

    const confidence =
        calculateConfidence({
            historyCount:
                validHistory.length,
            historyDays,
            volatility
        });

    return {
        status:
            "available",
        outlook,
        confidence,
        historyCount:
            validHistory.length,
        historyDays:
            round(
                historyDays
            ),
        currentPrice:
            round(
                currentPrice
            ),
        trend: {
            recentChange:
                round(
                    recentChange
                ),
            slopePerDay:
                round(
                    slopePerDay,
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
                    round(
                        expectedChange7Day
                    )
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
                    round(
                        expectedChange30Day
                    )
            }
        }
    };
};

export {
    calculateForecast
};
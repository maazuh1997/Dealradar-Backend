const calculateTotalPrice = (
    offer
) => {
    const price =
        Number(
            offer.price
        ) || 0;

    const shipping =
        Number(
            offer.shippingCost
        ) || 0;

    return price + shipping;
};

const rankOffers = (
    offers
) => {
    if (
        !Array.isArray(
            offers
        )
    ) {
        return [];
    }

    return offers
        .map(
            (offer) => ({
                ...offer,
                totalPrice:
                    calculateTotalPrice(
                        offer
                    )
            })
        )
        .filter(
            (offer) =>
                Number.isFinite(
                    offer.totalPrice
                ) &&
                offer.totalPrice >= 0
        )
        .sort(
            (a, b) =>
                a.totalPrice -
                b.totalPrice
        );
};

const getBestOffer = (
    offers
) => {
    const ranked =
        rankOffers(
            offers
        );

    return ranked[0] ||
        null;
};

const getPriceSpread = (
    offers
) => {
    const ranked =
        rankOffers(
            offers
        );

    if (
        ranked.length < 2
    ) {
        return {
            lowest: ranked[0]
                ?.totalPrice || 0,
            highest:
                ranked[0]
                    ?.totalPrice || 0,
            spread: 0,
            percentage: 0
        };
    }

    const lowest =
        ranked[0]
            .totalPrice;

    const highest =
        ranked[
            ranked.length - 1
        ].totalPrice;

    const spread =
        highest -
        lowest;

    const percentage =
        lowest > 0
            ? Number(
                (
                    spread /
                    lowest *
                    100
                ).toFixed(2)
            )
            : 0;

    return {
        lowest,
        highest,
        spread,
        percentage
    };
};

const getMerchantRanking =
    (offers) => {
        const ranked =
            rankOffers(
                offers
            );

        return ranked.map(
            (
                offer,
                index
            ) => ({
                rank:
                    index + 1,
                merchant:
                    offer.merchant,
                merchantKey:
                    offer.merchantKey,
                price:
                    offer.price,
                shippingCost:
                    offer.shippingCost,
                totalPrice:
                    offer.totalPrice,
                currency:
                    offer.currency,
                availability:
                    offer.availability,
                url:
                    offer.url,
                affiliateUrl:
                    offer.affiliateUrl
            })
        );
    };

export {
    calculateTotalPrice,
    rankOffers,
    getBestOffer,
    getPriceSpread,
    getMerchantRanking
};
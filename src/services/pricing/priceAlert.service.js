import PriceAlert from "../../models/PriceAlert.js";
import Notification from "../../models/Notification.js";
import createNotification from "../notifications/notification.service.js";

const processPriceAlert = async (offer) => {
    const alerts = await PriceAlert.find({
        product: offer.product,
        isActive: true,
        targetPrice: {
            $gte: offer.price
        }
    });

    if (!alerts.length) {
        return [];
    }

    const notifications = [];

    for (const alert of alerts) {
        const alreadyNotified = await Notification.findOne({
            user: alert.user,
            product: offer.product,
            offer: offer._id,
            type: "price_target",
            "data.targetPrice": alert.targetPrice,
            "data.currentPrice": offer.price,
            createdAt: {
                $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
        });

        if (alreadyNotified) {
            continue;
        }

        const notification = await createNotification({
            user: alert.user,
            type: "price_target",
            title: "Price target reached",
            message: `${offer.merchant} has dropped to ${offer.currency} ${offer.price}. Your target was ${offer.currency} ${alert.targetPrice}.`,
            product: offer.product,
            offer: offer._id,
            data: {
                currentPrice: offer.price,
                targetPrice: alert.targetPrice,
                merchant: offer.merchant,
                currency: offer.currency
            }
        });

        alert.lastTriggeredAt = new Date();
        alert.triggeredCount += 1;

        await alert.save();

        notifications.push(notification);
    }

    return notifications;
};

export default processPriceAlert;
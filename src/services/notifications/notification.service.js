import Notification from "../../models/Notification.js";

const createNotification = async ({
    user,
    type,
    title,
    message,
    product,
    offer,
    data
}) => {
    const notification = await Notification.create({
        user,
        type,
        title,
        message,
        product: product || null,
        offer: offer || null,
        data: data || {}
    });

    return notification;
};

export default createNotification;
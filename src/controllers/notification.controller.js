import Notification from "../models/Notification.js";
import asyncHandler from "../utils/asyncHandler.js";

const getNotifications = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        unreadOnly = "false"
    } = req.query;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(
        Math.max(Number(limit), 1),
        100
    );

    const filter = {
        user: req.user._id
    };

    if (unreadOnly === "true") {
        filter.isRead = false;
    }

    const skip = (pageNumber - 1) * limitNumber;

    const [notifications, total, unreadCount] =
        await Promise.all([
            Notification.find(filter)
                .populate("product", "title slug images")
                .populate(
                    "offer",
                    "merchant price currency url affiliateUrl"
                )
                .sort({
                    createdAt: -1
                })
                .skip(skip)
                .limit(limitNumber),
            Notification.countDocuments(filter),
            Notification.countDocuments({
                user: req.user._id,
                isRead: false
            })
        ]);

    res.status(200).json({
        success: true,
        data: {
            notifications,
            unreadCount,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                total,
                pages: Math.ceil(total / limitNumber),
                hasNextPage: pageNumber * limitNumber < total,
                hasPreviousPage: pageNumber > 1
            }
        }
    });
});

const markNotificationAsRead = asyncHandler(
    async (req, res) => {
        const notification = await Notification.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        if (!notification.isRead) {
            notification.isRead = true;
            notification.readAt = new Date();

            await notification.save();
        }

        res.status(200).json({
            success: true,
            message: "Notification marked as read",
            data: {
                notification
            }
        });
    }
);

const markAllNotificationsAsRead = asyncHandler(
    async (req, res) => {
        await Notification.updateMany(
            {
                user: req.user._id,
                isRead: false
            },
            {
                $set: {
                    isRead: true,
                    readAt: new Date()
                }
            }
        );

        res.status(200).json({
            success: true,
            message: "All notifications marked as read"
        });
    }
);

const deleteNotification = asyncHandler(
    async (req, res) => {
        const notification = await Notification.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        await notification.deleteOne();

        res.status(200).json({
            success: true,
            message: "Notification deleted"
        });
    }
);

export {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification
};
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        type: {
            type: String,
            enum: [
                "price_drop",
                "price_target",
                "deal_alert",
                "system"
            ],
            required: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        message: {
            type: String,
            required: true,
            trim: true
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            default: null,
            index: true
        },
        offer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Offer",
            default: null
        },
        data: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true
        },
        readAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

notificationSchema.index({
    user: 1,
    isRead: 1,
    createdAt: -1
});

const Notification = mongoose.model(
    "Notification",
    notificationSchema
);

export default Notification;
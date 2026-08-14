import mongoose from "mongoose";

const priceAlertSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            index: true
        },
        targetPrice: {
            type: Number,
            required: true,
            min: 0
        },
        currency: {
            type: String,
            default: "USD",
            uppercase: true
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        },
        lastTriggeredAt: {
            type: Date,
            default: null
        },
        triggeredCount: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

priceAlertSchema.index({
    user: 1,
    product: 1,
    isActive: 1
});

const PriceAlert = mongoose.model(
    "PriceAlert",
    priceAlertSchema
);

export default PriceAlert;
import mongoose from "mongoose";

const priceHistorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true
    },
    offer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offer",
      required: true,
      index: true
    },
    merchant: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: "USD",
      uppercase: true
    },
    recordedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

priceHistorySchema.index({
  product: 1,
  recordedAt: -1
});

const PriceHistory = mongoose.model(
  "PriceHistory",
  priceHistorySchema
);

export default PriceHistory;
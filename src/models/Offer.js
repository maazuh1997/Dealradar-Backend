import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true
    },
    merchant: {
      type: String,
      required: true,
      trim: true
    },
    title: {
      type: String,
      trim: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    affiliateUrl: {
      type: String,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    originalPrice: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: "USD",
      uppercase: true
    },
    availability: {
      type: String,
      enum: ["in_stock", "out_of_stock", "preorder", "unknown"],
      default: "unknown"
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: 0
    },
    provider: {
      type: String,
      required: true,
      trim: true
    },
    lastChecked: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

offerSchema.index({
  product: 1,
  merchant: 1
});

const Offer = mongoose.model("Offer", offerSchema);

export default Offer;
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    brand: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    images: {
      type: [String],
      default: []
    },
    identifiers: {
      sku: String,
      upc: String,
      ean: String,
      gtin: String
    },
    specifications: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    rating: {
      type: Number,
      default: 0
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

productSchema.index({
  title: "text",
  brand: "text",
  category: "text"
});

const Product = mongoose.model("Product", productSchema);

export default Product;
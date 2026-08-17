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
    identity: {
      fingerprint: {
        type: String,
        index: true
      },
      normalizedTitle: {
        type: String,
        default: ""
      },
      normalizedBrand: {
        type: String,
        default: ""
      },
      normalizedCategory: {
        type: String,
        default: ""
      },
      model: {
        type: String,
        default: ""
      },
      identityType: {
        type: String,
        enum: [
          "identifier",
          "brand_model",
          "title"
        ],
        default: "title"
      },
      confidence: {
        type: String,
        enum: [
          "very_high",
          "high",
          "medium",
          "low"
        ],
        default: "medium"
      }
    },
    providerIds: {
      type: [
        {
          provider: {
            type: String,
            required: true
          },
          externalId: {
            type: String,
            required: true
          }
        }
      ],
      default: []
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

productSchema.index({
  "identity.fingerprint": 1
});

productSchema.index({
  "providerIds.provider": 1,
  "providerIds.externalId": 1
});

const Product =
  mongoose.model(
    "Product",
    productSchema
  );

export default Product;
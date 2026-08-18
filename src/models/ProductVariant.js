import mongoose from "mongoose";


const productVariantSchema =
    new mongoose.Schema(
        {
            product: {
                type:
                    mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true,
                index: true
            },
            title: {
                type: String,
                required: true,
                trim: true
            },
            slug: {
                type: String,
                required: true,
                trim: true
            },
            variantKey: {
                type: String,
                required: true,
                trim: true
            },
            fingerprint: {
                type: String,
                required: true,
                trim: true,
                index: true
            },
            attributes: {
                type:
                    mongoose.Schema.Types.Mixed,
                default: {}
            },
            identifiers: {
                sku: String,
                upc: String,
                ean: String,
                gtin: String,
                mpn: String
            },
            specifications: {
                type:
                    mongoose.Schema.Types.Mixed,
                default: {}
            },
            images: {
                type: [String],
                default: []
            },
            identity: {
                confidence: {
                    type: String,
                    enum: [
                        "very_high",
                        "high",
                        "medium",
                        "low"
                    ],
                    default: "medium"
                },
                sources: {
                    type: [String],
                    default: []
                }
            },
            providerIds: {
                type: [
                    {
                        _id: false,
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
            }
        },
        {
            timestamps: true
        }
    );


productVariantSchema.index({
    product: 1,
    variantKey: 1
});


productVariantSchema.index({
    product: 1,
    fingerprint: 1
});


productVariantSchema.index({
    "providerIds.provider": 1,
    "providerIds.externalId": 1
});


const ProductVariant =
    mongoose.model(
        "ProductVariant",
        productVariantSchema
    );


export default ProductVariant;
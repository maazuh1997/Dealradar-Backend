import mongoose from "mongoose";

const productSearchCacheSchema =
    new mongoose.Schema(
        {
            query: {
                type: String,
                required: true,
                trim: true
            },
            country: {
                type: String,
                required: true,
                lowercase: true,
                trim: true
            },
            provider: {
                type: String,
                required: true,
                trim: true
            },
            results: {
                type: mongoose.Schema.Types.Mixed,
                default: []
            },
            meta: {
                type: mongoose.Schema.Types.Mixed,
                default: {}
            },
            expiresAt: {
                type: Date,
                required: true,
                index: {
                    expires: 0
                }
            }
        },
        {
            timestamps: true
        }
    );

productSearchCacheSchema.index(
    {
        query: 1,
        country: 1,
        provider: 1
    },
    {
        unique: true
    }
);

const ProductSearchCache =
    mongoose.model(
        "ProductSearchCache",
        productSearchCacheSchema
    );

export default ProductSearchCache;
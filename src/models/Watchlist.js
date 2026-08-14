import mongoose from "mongoose";

const watchlistSchema = new mongoose.Schema(
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
        }
    },
    {
        timestamps: true
    }
);

watchlistSchema.index(
    {
        user: 1,
        product: 1
    },
    {
        unique: true
    }
);

const Watchlist = mongoose.model(
    "Watchlist",
    watchlistSchema
);

export default Watchlist;
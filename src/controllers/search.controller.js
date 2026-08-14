import asyncHandler from "../utils/asyncHandler.js";
import searchProducts from "../services/search/productSearch.service.js";

const search = asyncHandler(
    async (req, res) => {
        const {
            q,
            country = "us",
            page = 1,
            limit = 5
        } = req.query;

        if (!q?.trim()) {
            return res.status(400).json({
                success: false,
                message:
                    "Search query is required"
            });
        }

        const limitNumber = Math.min(
            Math.max(Number(limit), 1),
            5
        );

        const pageNumber = Math.max(
            Number(page),
            1
        );

        const result =
            await searchProducts({
                query: q,
                country,
                page: pageNumber,
                limit: limitNumber
            });

        res.status(200).json({
            success: true,
            data: result
        });
    }
);

export {
    search
};
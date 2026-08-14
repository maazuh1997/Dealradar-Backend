import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";
import createSlug from "../utils/createSlug.js";

const createProduct = asyncHandler(async (req, res) => {
    const {
        title,
        brand,
        category,
        description,
        images,
        identifiers,
        specifications,
        rating,
        reviewCount,
        metadata
    } = req.body;

    if (!title) {
        return res.status(400).json({
            success: false,
            message: "Product title is required"
        });
    }

    const baseSlug = createSlug(title);

    let slug = baseSlug;
    let counter = 1;

    while (await Product.exists({ slug })) {
        slug = `${baseSlug}-${counter}`;
        counter += 1;
    }

    const product = await Product.create({
        title: title.trim(),
        slug,
        brand,
        category,
        description,
        images,
        identifiers,
        specifications,
        rating,
        reviewCount,
        metadata
    });

    res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: {
            product
        }
    });
});

const getProducts = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        category,
        brand,
        sort = "newest"
    } = req.query;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(Number(limit), 1), 100);

    const filter = {};

    if (category) {
        filter.category = category;
    }

    if (brand) {
        filter.brand = brand;
    }

    let sortOption = {
        createdAt: -1
    };

    if (sort === "oldest") {
        sortOption = {
            createdAt: 1
        };
    }

    if (sort === "rating") {
        sortOption = {
            rating: -1
        };
    }

    if (sort === "reviews") {
        sortOption = {
            reviewCount: -1
        };
    }

    const skip = (pageNumber - 1) * limitNumber;

    const [products, total] = await Promise.all([
        Product.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(limitNumber),
        Product.countDocuments(filter)
    ]);

    res.status(200).json({
        success: true,
        data: {
            products,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                total,
                pages: Math.ceil(total / limitNumber),
                hasNextPage: pageNumber * limitNumber < total,
                hasPreviousPage: pageNumber > 1
            }
        }
    });
});

const searchProducts = asyncHandler(async (req, res) => {
    const {
        q,
        page = 1,
        limit = 20
    } = req.query;

    if (!q?.trim()) {
        return res.status(400).json({
            success: false,
            message: "Search query is required"
        });
    }

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(Number(limit), 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const searchQuery = {
        $text: {
            $search: q.trim()
        }
    };

    const [products, total] = await Promise.all([
        Product.find(
            searchQuery,
            {
                score: {
                    $meta: "textScore"
                }
            }
        )
            .sort({
                score: {
                    $meta: "textScore"
                }
            })
            .skip(skip)
            .limit(limitNumber),
        Product.countDocuments(searchQuery)
    ]);

    res.status(200).json({
        success: true,
        data: {
            products,
            query: q.trim(),
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                total,
                pages: Math.ceil(total / limitNumber),
                hasNextPage: pageNumber * limitNumber < total,
                hasPreviousPage: pageNumber > 1
            }
        }
    });
});

const getProductBySlug = asyncHandler(async (req, res) => {
    const product = await Product.findOne({
        slug: req.params.slug
    });

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }

    res.status(200).json({
        success: true,
        data: {
            product
        }
    });
});

const updateProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }

    const {
        title,
        brand,
        category,
        description,
        images,
        identifiers,
        specifications,
        rating,
        reviewCount,
        metadata
    } = req.body;

    if (title !== undefined) {
        product.title = title.trim();
    }

    if (brand !== undefined) {
        product.brand = brand;
    }

    if (category !== undefined) {
        product.category = category;
    }

    if (description !== undefined) {
        product.description = description;
    }

    if (images !== undefined) {
        product.images = images;
    }

    if (identifiers !== undefined) {
        product.identifiers = identifiers;
    }

    if (specifications !== undefined) {
        product.specifications = specifications;
    }

    if (rating !== undefined) {
        product.rating = rating;
    }

    if (reviewCount !== undefined) {
        product.reviewCount = reviewCount;
    }

    if (metadata !== undefined) {
        product.metadata = metadata;
    }

    await product.save();

    res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: {
            product
        }
    });
});

const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }

    await product.deleteOne();

    res.status(200).json({
        success: true,
        message: "Product deleted successfully"
    });
});

export {
    createProduct,
    getProducts,
    searchProducts,
    getProductBySlug,
    updateProduct,
    deleteProduct
};
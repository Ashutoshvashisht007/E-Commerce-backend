import { Request } from "express";
import { TryCatchBlockWrapper } from "../middlewares/Error.js";
import { BaseQuery, SearchRequestQuery, newProductRequestBody } from "../types/Types.js";
import { Product } from "../schema/Product.js";
import ErrorHandler from "../utils/Utility_Class.js";
import { rm } from "fs";
import { nodeCache } from "../app.js";
import { invalidatesCache } from "../utils/Features.js";

export const newProduct = TryCatchBlockWrapper(
    async (
        req: Request<{}, {}, newProductRequestBody>,
        res,
        next) => {

        const { name, price, stock, category } = req.body;
        const photo = req.file;

        if (!photo) {
            return next(new ErrorHandler("No photo Added", 400));
        }

        if (!name || !price || !stock || !category) {

            rm(photo.path, () => {
                // console.log("Deleted");
            })

            return next(new ErrorHandler("Please enter all fields", 400));
        }

        const product = await Product.create({
            name,
            photo: photo.path,
            price,
            stock,
            category: category.toLowerCase(),
        })

        invalidatesCache({product: true, admin: true});

        return res.status(201).json({
            success: "true",
            message: "Product created successfully"
        })
    }
);

export const getLatestProducts = TryCatchBlockWrapper(
    async (
        req: Request<{}, {}, newProductRequestBody>,
        res,
        next,
    ) => {

        let products;

        if (nodeCache.has("latest-product")) {
            products = JSON.parse(nodeCache.get("latest-product") as string);
        }
        else {
            products = await Product.find({}).sort({ createdAt: -1 }).limit(5);

            nodeCache.set("latest-product", JSON.stringify(products));
        }


        return res.status(201).json({
            succes: true,
            products
        })
    }
);

export const getAllCategories = TryCatchBlockWrapper(
    async (
        req: Request<{}, {}, newProductRequestBody>,
        res,
        next,
    ) => {

        let categories;

        if(nodeCache.has("categories"))
        {
            categories = JSON.parse(nodeCache.get("categories") as string);
        }
        else{
            categories = await Product.distinct("category");
            nodeCache.set("categories",JSON.stringify(categories));
        }

        return res.status(201).json({
            succes: true,
            categories
        })
    }
)

export const getAdminProducts = TryCatchBlockWrapper(
    async (
        req: Request<{}, {}, newProductRequestBody>,
        res,
        next,
    ) => {

        let products;

        if(nodeCache.has("admin-products"))
        {
            products = JSON.parse(nodeCache.get("admin-products") as string);
        }
        else
        {
            products = await Product.find({});
            nodeCache.set("admin-products",JSON.stringify(products));
        }

        return res.status(201).json({
            succes: true,
            products
        })
    }
);

export const getSingleProduct = TryCatchBlockWrapper(
    async (
        req,
        res,
        next,
    ) => {

        let product;
        const {id} = req.params;

        if(nodeCache.has(`product-${id}`))
        {
            product = JSON.parse(nodeCache.get(`product-${id}`) as string);
        }
        else
        {
            product = await Product.findById(id);

            if (!product) {
                return next(new ErrorHandler("Invalid Product ID", 400));
            }

            nodeCache.set(`product-${id}`,JSON.stringify(product));
        }

        return res.status(201).json({
            succes: true,
            product
        })
    }
);



export const updateProduct = TryCatchBlockWrapper(
    async (
        req,
        res,
        next) => {

        const { id } = req.params;

        const { name, price, stock, category } = req.body;
        const photo = req.file;

        const product = await Product.findById(id);

        if (!product) {
            return next(new ErrorHandler("Invalid Product ID", 400));
        }

        if (photo) {

            rm(product.photo!, () => {
                console.log("Deleted");
            });

            product.photo = photo.path;
        }

        if (name) {
            product.name = name;
        }
        if (price) {
            product.price = price;
        }
        if (stock) {
            product.stock = stock;
        }
        if (category) {
            product.category = category;
        }

        await product.save();

        invalidatesCache({product: true, productId: String(product._id), admin: true});

        return res.status(200).json({
            success: "true",
            message: "Product updated successfully"
        })
    }
);

export const deleteProduct = TryCatchBlockWrapper(
    async (
        req,
        res,
        next,
    ) => {

        const {id} = req.params;

        const product = await Product.findById(id);

        if (!product) {
            return next(new ErrorHandler("Invalid Product ID", 400));
        }

        rm(product.photo!, () => {
            console.log("Product Photo Deleted");
        });

        await product.deleteOne();

        invalidatesCache({product: true, productId: String(product._id),admin: true}, );

        return res.status(200).json({
            succes: true,
            message: "Product deleted successfully"
        })
    }
);


export const getAllProducts = TryCatchBlockWrapper(
    async (
        req: Request<{}, {}, {}, SearchRequestQuery>,
        res,
        next,
    ) => {

        const { search, sort, category, price } = req.query;

        const page = Number(req.query.page) || 1;

        const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
        const skip = limit * (page - 1);

        const baseQuery: BaseQuery = {}

        if (search) {
            baseQuery.name = {
                $regex: search,
                $options: "i", //case sensitive
            }
        }

        if (price) {
            baseQuery.price = {
                $lte: Number(price) // lte = less than equal
            }
        }

        if (category) {
            baseQuery.category = category;
        }

        const [products, filteredProducts] = await Promise.all([
            Product.find(baseQuery).sort(
                sort && { price: sort === "asc" ? 1 : -1 }
            ).limit(limit).skip(skip),

            Product.find(baseQuery)
        ]);

        const totalPage = Math.ceil(filteredProducts.length / limit);

        return res.status(201).json({
            succes: true,
            products,
            totalPage,
        })
    }
);
import mongoose, { Document } from "mongoose"
import { InvalidateCacheProps, OrderItemType } from "../types/Types.js";
import { nodeCache } from "../app.js";
import { Product } from "../schema/Product.js";


export const connectDB = (uri: string) => {
    mongoose.connect(uri, {
        dbName: "Ecommerce",
    }).then(connect => console.log(`DataBase Connected to ${connect.connection.host}`)).catch(e => console.log(e));
};

export const invalidatesCache = ({ product, order, admin, userId, orderId, productId }: InvalidateCacheProps) => {
    if (product) {
        const productKeys: string[] = ["latest-product", "categories", "admin-products"];

        if (typeof productId === "string") {
            productKeys.push(`product-${productId}`);
        }
        if (typeof productId === "object") {
            productId.forEach(e =>
                productKeys.push(`product-${e}`)
            )
        }

        nodeCache.del(productKeys)
    }
    if (order) {
        const ordersKeys: string[] = ["all-orders", `my-Orders-${userId}`, `order-${orderId}`];

        nodeCache.del(ordersKeys)
    }
    if (admin) {
        nodeCache.del([
            "admin-stats",
            "admin-pie-charts",
            "admin-bar-charts",
            "admin-line-charts"
        ]);
    }
};

export const reduceStock = async (orderItems: OrderItemType[]) => {
    for (let i = 0; i < orderItems.length; i++) {
        const order = orderItems[i];

        const product = await Product.findById(order.productId);
        if (!product) {
            throw new Error("Product Not Found");
        }

        product.stock -= order.quantity;

        await product.save();
    }
}

export const calculatePercentage = (thisMonth: number, lastMonth: number) => {
    if (lastMonth === 0) {
        return thisMonth * 100;
    }
    const percent = (thisMonth / lastMonth) * 100;
    return Number(percent.toFixed(0));
}

interface MyDocument extends Document {
    createdAt: Date;
    discount?: number,
    total?: number
}

type getChartDataProps = {
    length: number;
    docArr: MyDocument[];
    property?: "discount" | "total"
}

export const getChartData = ({ length, docArr, property }: getChartDataProps) => {
    const data: number[] = new Array(length).fill(0);
    const today = new Date();

    docArr.forEach((idx) => {
        const Created = idx.createdAt;
        const monthDiff = ((today.getMonth() - Created.getMonth()) + 12) % 12;

        if (monthDiff < length) {
            if (property) {
                data[length - monthDiff - 1] += idx[property]!;
            }
            else {
                data[length - monthDiff - 1] += 1;
            }

        }
    });

    return data;
}
import { Request } from "express";
import { TryCatchBlockWrapper } from "../middlewares/Error.js";
import { NewOrderRequestBody } from "../types/Types.js";
import { Order } from "../schema/Order.js";
import { invalidatesCache, reduceStock } from "../utils/Features.js";
import ErrorHandler from "../utils/Utility_Class.js";
import { nodeCache } from "../app.js";


export const newOrder = TryCatchBlockWrapper(
    async (
        req: Request< {}, {}, NewOrderRequestBody>,
        res,
        next,
    )=>{

    const {shippingInfo, orderItems, user, subtotal, tax, shippingCharges, discount, total} = req.body;

    if(!shippingInfo || !orderItems || !user || !subtotal || !tax || !shippingCharges || !discount || !total)
    {
        return next(new ErrorHandler("Please Enter All fields",400)); 
    }

    const order = await Order.create({
        shippingInfo, orderItems, user, subtotal, tax, shippingCharges, discount, total
    });

    await reduceStock(orderItems);
    const temp = order.orderItems.map((e)=>
        String(e.productId)
    )
    invalidatesCache({
        product : true, order: true, admin: true, userId: user, productId: temp
    });

    return res.status(201).json({
        success: true,
        message: "Order Placed Successfuly",
    })

});

export const myOrders = TryCatchBlockWrapper(
    async (
        req,
        res,
        next,
    )=>{

    const {id: user} = req.query;

    let orders = [];

    if(nodeCache.has(`my-Orders-${user}`))
    {
        orders = JSON.parse(nodeCache.get(`my-Orders-${user}`) as string);
    }
    else
    {
        orders = await Order.find({
            user
        });
        nodeCache.set(`my-Orders-${user}`,JSON.stringify(orders));
    }

    return res.status(200).json({
        success: true,
        orders
    })

});

export const allOrders = TryCatchBlockWrapper(
    async (
        req,
        res,
        next,
    )=>{

    let orders = [];

    if(nodeCache.has("all-orders"))
    {
        orders = JSON.parse(nodeCache.get("all-orders") as string);
    }
    else
    {
        orders = await Order.find().populate("user","name");
        nodeCache.set("all-orders",JSON.stringify(orders));
    }

    return res.status(200).json({
        success: true,
        orders
    })

});

export const getSingleOrder = TryCatchBlockWrapper(
    async (
        req,
        res,
        next,
    )=>{

    const {id} = req.params;
    const key = `order-${id}`;

    let order;

    if(nodeCache.has(key))
    {
        order = JSON.parse(nodeCache.get(key) as string);
    }
    else
    {
        order = await Order.findById(id).populate("user","name");
        if(!order)
        {
            return next(new ErrorHandler("Order not found", 404));
        }
        nodeCache.set(key,JSON.stringify(order));
    }

    return res.status(200).json({
        success: true,
        order
    })

});


export const processOrder = TryCatchBlockWrapper(
    async (
        req,
        res,
        next,
    )=>{

    const {id} = req.params;

    const order = await Order.findById(id);

    if(!order)
    {
        return next(new ErrorHandler("Order not found", 404));
    }
    
    if(order.status === "Processing")
    {
        order.status = "Shipped";
    }
    else if(order.status === "Shipped")
    {
        order.status = "Delivered"
    }

    await order.save();

    invalidatesCache({product : false, order: true, admin: true, userId: order.user, orderId: String(order._id)});

    return res.status(200).json({
        success: true,
        message: "Order Processed Successfully"
    })

});

export const deleteOrder = TryCatchBlockWrapper(
    async (
        req,
        res,
        next,
    )=>{

    const {id} = req.params;

    const order = await Order.findById(id);

    if(!order)
    {
        return next(new ErrorHandler("Order not found", 404));
    }
    
    await order.deleteOne();
    invalidatesCache({product : false, order: true, admin: true, userId: order.user, orderId: String(order._id)});

    return res.status(200).json({
        success: true,
        message: "Order Deleted Successfully"
    })

});
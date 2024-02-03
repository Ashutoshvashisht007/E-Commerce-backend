import { Request } from "express";
import { TryCatchBlockWrapper } from "../middlewares/Error.js";
import { NewCouponrRequestBody, NewOrderRequestBody, newStripeRequestBody } from "../types/Types.js";
import ErrorHandler from "../utils/Utility_Class.js";
import { Coupon } from "../schema/Coupon.js";
import { stripe } from "../app.js";

export const createPayment = TryCatchBlockWrapper(
    async (req:Request< {}, {}, newStripeRequestBody>, res, next) => {
        const { amount } = req.body;

        if (!amount) {
            return next(new ErrorHandler("Please Enter All Fields", 400));
        }

        const payementIntent = await stripe.paymentIntents.create({
            amount: Number(amount) * 100,
            currency: 'inr',
            description: "for ecommersce project",
        });

        return res.status(201).json({
            success: true,
            clientSecret: payementIntent.client_secret,
        })
    }
)


export const newCoupon = TryCatchBlockWrapper(
    async (
        req: Request<{}, {}, NewCouponrRequestBody>,
        res,
        next
    ) => {

        const { coupon, amount } = req.body;

        if (!coupon || !amount) {
            return next(new ErrorHandler("Please Enter All Fields", 400));
        }

        await Coupon.create({
            coupon,
            amount
        });

        return res.status(200).json({
            success: true,
            message: "Coupon created successfully"
        })
    });

export const applyDiscount = TryCatchBlockWrapper(
    async (
        req,
        res,
        next
    ) => {

        const { coupon } = req.query;
        const discount = await Coupon.findOne({ coupon });

        if (!discount) {
            return next(new ErrorHandler("Invalid Coupon", 400));
        }



        return res.status(200).json({
            success: true,
            discount: discount.amount,
        })
    });

export const allCoupons = TryCatchBlockWrapper(
    async (
        req,
        res,
        next
    ) => {
        const coupons = await Coupon.find({});

        if (!coupons) {
            return next(new ErrorHandler("No Coupons Present", 400));
        }

        return res.status(200).json({
            success: true,
            coupons,
        })
    });

export const deleteCoupon = TryCatchBlockWrapper(
    async (
        req,
        res,
        next
    ) => {
        const { id } = req.params;
        const Coupons = await Coupon.findById(id);
        console.log(Coupons);

        if (!Coupons) {
            return next(new ErrorHandler("Invalid Coupon", 400));
        }

        await Coupons.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Coupon Deleted successfully"
        })
    });
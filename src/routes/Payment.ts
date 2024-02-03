import express from "express";
import { allCoupons, applyDiscount, createPayment, deleteCoupon, newCoupon } from "../controllers/Payment.js";
import { adminOnly } from "../middlewares/Auth.js";

const app = express.Router();

app.post("/create",createPayment);
app.post("/coupon/new", adminOnly, newCoupon);
app.get("/coupon/all", adminOnly, allCoupons);
app.delete("/coupon/:id", adminOnly, deleteCoupon);
app.get("/discount", applyDiscount);


export default app;
import { config } from "dotenv";
import morgan from "morgan";
import express from "express";
import NodeCache from "node-cache";
import { connectDB } from "./utils/Features.js";
import { errorMiddleware } from "./middlewares/Error.js";
import Stripe from "stripe";
import cors from "cors";


// importing Routes
import userRoute from "./routes/User.js"
import userProducts from "./routes/Products.js"
import orderRoute from "./routes/Order.js"
import paymentRoute from "./routes/Payment.js"
import DashboardRoute from "./routes/Stats.js"

config(
    {path: "./.env",}
)

const port = process.env.PORT || 3000;
const mongoURI = process.env.MONGO_URI || "";
const stripeKey = process.env.STRIPE_KEY || "";

connectDB(mongoURI);

export const stripe = new Stripe(stripeKey);
export const nodeCache = new NodeCache();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/",(req,res)=>{
    res.send("API is Working");
})

// using Routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/product", userProducts);
app.use("/api/v1/order", orderRoute);
app.use("/api/v1/payment", paymentRoute);
//Admin routes
app.use("/api/v1/dashboard", DashboardRoute);

app.use(errorMiddleware);
app.use("/uploads", express.static("uploads"));

app.listen(port, ()=>{
    console.log(`Server is working on http://localhost:${port}`);
})
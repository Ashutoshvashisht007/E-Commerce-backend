import express from "express";
import { adminOnly } from "../middlewares/Auth.js";
import { allOrders, deleteOrder, getSingleOrder, myOrders, newOrder, processOrder } from "../controllers/Order.js";

const app = express.Router();

app.post("/new", newOrder);

app.get("/myOrders", myOrders);
app.get("/all", adminOnly, allOrders);
app.get("/:id", getSingleOrder);
app.put("/:id", adminOnly, processOrder);
app.delete("/:id", adminOnly, deleteOrder);

export default app;
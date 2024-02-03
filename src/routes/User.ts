import express from "express";
import { deleteUser, getAllUsers, getUser, newUser } from "../controllers/User.js";
import { adminOnly } from "../middlewares/Auth.js";

const app = express.Router();

// route: /api/v1/user/new
app.post("/new", newUser);
// route: /api/v1/user/all
app.get("/all", adminOnly, getAllUsers)
// route: /api/v1/user/dynamicid
app.get("/:id", getUser)
// route: /api/v1/user/dynamicid
app.delete("/:id", adminOnly, deleteUser)

export default app;
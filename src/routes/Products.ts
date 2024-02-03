import express from "express";
import { adminOnly } from "../middlewares/Auth.js";
import { deleteProduct, getAdminProducts, getAllCategories, getAllProducts, getLatestProducts, getSingleProduct, newProduct, updateProduct } from "../controllers/Product.js";
import { singleUpload } from "../middlewares/Multer.js";

const app = express.Router();

app.post("/new", adminOnly ,singleUpload, newProduct);
app.get("/all",getAllProducts)
app.get("/latest", getLatestProducts);
app.get("/categories", getAllCategories);
app.get("/admin-products",adminOnly, getAdminProducts);

app.get("/:id",getSingleProduct);
app.put("/:id",adminOnly,singleUpload, updateProduct);
app.delete("/:id",adminOnly, deleteProduct);

export default app;
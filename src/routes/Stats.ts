import express, { Router } from "express";
import { dashboardBar, dashboardLine, dashboardPie, dashboardStats } from "../controllers/Stats.js";
import { adminOnly } from "../middlewares/Auth.js";

const app = Router();

app.get("/stats",adminOnly, dashboardStats);
app.get("/pie",adminOnly, dashboardPie);
app.get("/bar",adminOnly, dashboardBar);
app.get("/line",adminOnly,dashboardLine);

export default app;
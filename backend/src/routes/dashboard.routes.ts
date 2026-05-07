import { Router } from "express";
import { getDashboard } from "../services/dashboard.service.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", (_req, res) => {
  res.json(getDashboard());
});

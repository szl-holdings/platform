import { Router, type IRouter } from "express";
import { services } from "@workspace/services";

const servicesRouter: IRouter = Router();

servicesRouter.get("/services/health", (_req, res) => {
  const matrix = services.getHealthMatrix();
  res.json(matrix);
});

export default servicesRouter;

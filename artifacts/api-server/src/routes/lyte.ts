import { Router, type IRouter } from "express";
import { db, lyteProductsTable, lyteOrdersTable, lyteOrderItemsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { sendSuccess, sendNotFound, sendError, handleRouteError } from "../lib/api-response";
import { authMiddleware, parseIdParam } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/lyte/products", authMiddleware(), async (_req, res) => {
  try {
    const products = await db.select().from(lyteProductsTable).orderBy(desc(lyteProductsTable.createdAt));
    sendSuccess(res, products);
  } catch (err) {
    handleRouteError(res, err, "Failed to list products");
  }
});

router.get("/lyte/products/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [product] = await db.select().from(lyteProductsTable).where(eq(lyteProductsTable.id, id));
    if (!product) { sendNotFound(res, "Product"); return; }
    sendSuccess(res, product);
  } catch (err) {
    handleRouteError(res, err, "Failed to get product");
  }
});

router.get("/lyte/orders", authMiddleware(), async (_req, res) => {
  try {
    const orders = await db.select().from(lyteOrdersTable).orderBy(desc(lyteOrdersTable.createdAt));
    sendSuccess(res, orders);
  } catch (err) {
    handleRouteError(res, err, "Failed to list orders");
  }
});

router.get("/lyte/orders/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [order] = await db.select().from(lyteOrdersTable).where(eq(lyteOrdersTable.id, id));
    if (!order) { sendNotFound(res, "Order"); return; }
    const items = await db.select().from(lyteOrderItemsTable).where(eq(lyteOrderItemsTable.orderId, id));
    sendSuccess(res, { ...order, items });
  } catch (err) {
    handleRouteError(res, err, "Failed to get order");
  }
});

export default router;

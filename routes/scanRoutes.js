import { Router } from "express";
import {
  createScan,
  getReports,
  getReportById,
  deleteReport,
} from "../controllers/scanController.js";

const router = Router();

// Wraps async handlers so thrown errors reach the global error middleware
// instead of crashing the process or hanging the request.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.post("/scan", asyncHandler(createScan));
router.get("/reports", asyncHandler(getReports));
router.get("/reports/:id", asyncHandler(getReportById));
router.delete("/reports/:id", asyncHandler(deleteReport));

export default router;

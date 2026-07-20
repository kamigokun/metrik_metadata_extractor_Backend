import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import scanRoutes from "./routes/scanRoutes.js";
import { notFound, errorHandler } from "./utils/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => res.json({ success: true, message: "ok" }));
app.use("/api", scanRoutes);

app.use(notFound);
app.use(errorHandler);

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`[server] listening on port ${PORT}`));
  } catch (err) {
    console.error("[server] failed to start:", err.message);
    process.exit(1);
  }
};

start();

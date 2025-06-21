import express from "express";
import cors from "cors";
import { createRoutes } from "./routes.js";
import { storage } from "./storage.js";

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use(createRoutes(storage));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Chess server running on port ${port}`);
});

export { storage };
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import familyRoutes from "./routes/familyRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://gogtekulam:gogtekul@cluster0.t3c0jt6.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0";

// Allow requests from both frontend and other origins
app.use(cors({ 
  origin: [CLIENT_ORIGIN, "http://localhost:3000", "http://localhost:4000"],
  credentials: true 
}));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/family", familyRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

console.log("=== SERVER STARTUP ===");
console.log("MONGO_URI:", MONGO_URI);
console.log("PORT:", PORT);
console.log("CLIENT_ORIGIN:", CLIENT_ORIGIN);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB successfully!");
    console.log("📊 Database: test");
    console.log("📦 Collection: Heirarchy_form");
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 API URL: http://localhost:${PORT}`);
      console.log("Ready to receive form submissions...");
    });
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  });

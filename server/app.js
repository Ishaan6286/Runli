// server/app.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import dietRoutes from "./routes/dietRoutes.js";
import foodRoutes from "./routes/foodRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import gymRoutes from "./routes/gymRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import habitRoutes from "./routes/habitRoutes.js";
import predictionRoutes from "./routes/predictionRoutes.js";
import visionRoutes from "./routes/visionRoutes.js";
import scoreRoutes from "./routes/scoreRoutes.js";
import contextRoutes from "./routes/contextRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import twinRoutes from "./routes/twinRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import ragRoutes from "./routes/ragRoutes.js";
import session from 'express-session';
import passport from './config/passport.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, ".env") });
connectDB();

// import { startAiWorker } from './services/workerService.js';
// import { setupCronJobs } from './services/queueService.js';
// startAiWorker();
// setupCronJobs();

const app = express();
const PORT = process.env.PORT || 5001;

// Request logging middleware (must be first to log all requests)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile/curl) or any localhost port
    if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true);
    }
    const allowed = process.env.FRONTEND_URL || "https://runli.vercel.app";
    if (origin === allowed) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

// Webhook must be parsed as raw body for signature verification
app.use('/api/subscription/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '50mb' }));

// Session & Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/diet", dietRoutes);
app.use("/api/food", foodRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/gyms", gymRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/prediction", predictionRoutes);
app.use("/api/vision", visionRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/score", scoreRoutes);
app.use("/api/context", contextRoutes);
app.use("/api/twin", twinRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/rag", ragRoutes);

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

import "dotenv/config";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { connectDb } from "./config/db.js";

// Router
import AuthRouter from "./modules/login/router/auth_router.js";
import UserRouter from "./modules/users/router/user_router.js";
import PatientRouter from "./modules/HealthWorker/patient/router/patient_router.js";
import ScreeningRouter from "./modules/HealthWorker/screening/router/screening_router.js";
import DoctorRouter from "./modules/Doctor/router/doctor_router.js";
import UploadRouter from "./service/upload-service/router/upload_router.js";

 

const app = express();

const PORT = process.env.PORT || 8000;

// ======================================================
// CORS
// ======================================================

const allowedOrigins = [
  
  // Local development
  "http://localhost:3000",
  "http://localhost:3001",

];

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);
// ======================================================
// Middleware
// ======================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ======================================================
// Health Check
// ======================================================

app.get("/", (req, res) => {
  res.json({
    message: "Hexar CMS server is running",
  });
});

// ======================================================
// Routes
// ======================================================

app.use("/auth", AuthRouter);
app.use("/users", UserRouter);
app.use("/patients", PatientRouter);
app.use("/screenings", ScreeningRouter);
app.use("/doctor", DoctorRouter);

// ======================================================
// Start Server
// ======================================================

async function startServer() {
  try {
    await connectDb();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to start server:", error);

    process.exit(1);
  }
}

startServer();
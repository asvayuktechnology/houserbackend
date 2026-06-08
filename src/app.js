import express from "express";
import cors from "cors";
import errorMiddleware from "./middlewares/error.middleware.js";
import userRoutes from "./routes/user.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import cookieParser from "cookie-parser";

const app = express();

// ✅ CORS CONFIG (production + dev)
const allowedOrigins = [
  "http://localhost:5173", // Vite default
  "http://localhost:5174", // Vite default
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  // production frontend URL add karna yaha
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (mobile apps, postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // if cookies/token
  })
);


app.use(cookieParser());

app.use(express.json());

// routes
app.use("/api/", userRoutes);
app.use("/api/admin", adminRoutes);

// error middleware (last)
app.use(errorMiddleware);

export default app;
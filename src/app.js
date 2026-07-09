import express from "express";
import cors from "cors";
import errorMiddleware from "./middlewares/error.middleware.js";
import userRoutes from "./routes/user.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import postRoutes from "./routes/post.route.js";
import settingRoutes from "./routes/setting.routes.js";
import leadRoutes from "./routes/lead.route.js";
import blogRoutes from "./routes/blog.routes.js"
import cityRoutes from "./routes/city.routes.js"
import cookieParser from "cookie-parser";

const app = express();

// ✅ CORS CONFIG (production + dev)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",

  "https://houzer.tech",
  "https://www.houzer.tech",

  // agar admin panel alag domain par hai
  "https://admin.houzer.tech",
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
app.use(express.urlencoded({ extended: true }));


app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Houser API Running"
  });
});

// routes
app.use("/api/", userRoutes);
app.use("/api/", postRoutes);
app.use("/api/", settingRoutes);
app.use("/api/", leadRoutes);
app.use("/api/", blogRoutes);
app.use("/api/", cityRoutes);
app.use("/api/admin", adminRoutes);

// error middleware (last)
app.use(errorMiddleware);

export default app;
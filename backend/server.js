const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();

// ✅ CORS Configuration
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://ethara-ai-assignment-two.vercel.app"
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like Postman, mobile apps)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        } else {
            return callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

// ✅ Handle preflight requests (VERY IMPORTANT)
app.options("*", cors());

// ✅ Rest of your middleware
app.use(morgan("dev"));
app.use(express.json());

// ✅ Your routes
// app.use("/api/auth", authRoutes);
// ...rest of code
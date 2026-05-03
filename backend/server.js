require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const connectDB = require("./config/db");

// ✅ ROUTES (ADD THESE)
const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const taskRoutes = require("./routes/tasks");
const miscRoutes = require("./routes/misc"); // dashboard/stats etc

const app = express();

// ✅ CORS
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://ethara-ai-assignment-two.vercel.app"
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        console.log("❌ Blocked by CORS:", origin);
        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
}));

app.options("*", cors());

// ✅ Middleware
app.use(morgan("dev"));
app.use(express.json());

// ✅ Health
app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

// ✅ Debug
app.get("/api/test", (req, res) => {
    res.json({ message: "Backend working ✅" });
});

// ✅ ROUTES (IMPORTANT)
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api", miscRoutes);

// ❗ 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: "Route not found",
        path: req.originalUrl
    });
});

// ❗ Error handler
app.use((err, req, res, next) => {
    console.error("🔥 ERROR:", err.message);
    res.status(500).json({
        error: err.message || "Internal Server Error"
    });
});

// ✅ PORT
const PORT = process.env.PORT || 5001;

// ✅ Start server
(async () => {
    try {
        await connectDB();
        console.log("✅ MongoDB Connected");

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });

    } catch (err) {
        console.error("❌ Failed to connect DB:", err);
        process.exit(1);
    }
})();
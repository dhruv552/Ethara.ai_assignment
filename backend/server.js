require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const taskRoutes = require("./routes/tasks");
const miscRoutes = require("./routes/misc");
const seed = require("./scripts/seed");

const app = express();
const __dirnamePath = __dirname;

// ✅ Serve frontend (FIXED PATH)
app.use(express.static(path.join(__dirnamePath, "dist")));

app.use(express.json({ limit: "1mb" }));

app.use(cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
}));

if (process.env.NODE_ENV !== "test") {
    app.use(morgan("tiny"));
}

// ✅ API routes
app.get("/api", (_req, res) =>
    res.json({ service: "ethara-ops", ok: true, time: new Date().toISOString() })
);

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api", miscRoutes);

// ✅ React fallback (FIXED PATH)
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirnamePath, "dist", "index.html"));
});

// ✅ Error handler LAST
app.use((err, req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal server error";

    console.error("\n" + "=".repeat(60));
    console.error("❌ ERROR CAUGHT");
    console.error("=".repeat(60));
    console.error("Status:", status);
    console.error("Message:", message);
    console.error("URL:", req?.originalUrl);
    console.error("Method:", req?.method);
    console.error("Body:", req?.body);
    console.error("User ID:", req?.user?._id);
    console.error("\nStack:");
    console.error(err.stack);
    console.error("=".repeat(60) + "\n");

    res.status(status).json({
        detail: message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
});

const PORT = parseInt(process.env.PORT, 10) || 5001;

(async () => {
    try {
        await connectDB();

        // ✅ Disable seed in production
        if (process.env.NODE_ENV !== "production") {
            await seed();
        }

        app.listen(PORT, "0.0.0.0", () =>
            console.log(`[api] running on http://0.0.0.0:${PORT}`)
        );
    } catch (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
})();

module.exports = app;
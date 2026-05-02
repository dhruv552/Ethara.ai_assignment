require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const taskRoutes = require("./routes/tasks");
const miscRoutes = require("./routes/misc");
const seed = require("./scripts/seed");

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(
    cors({
        origin: process.env.CLIENT_URL || "*",
        credentials: true,
    })
);
if (process.env.NODE_ENV !== "test") {
    app.use(morgan("tiny"));
}

app.get("/api", (_req, res) =>
    res.json({ service: "ethara-ops", ok: true, time: new Date().toISOString() })
);
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api", miscRoutes);

app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
});

const PORT = parseInt(process.env.PORT, 10) || 5001;

(async () => {
    try {
        await connectDB();
        await seed();
        app.listen(PORT, "0.0.0.0", () =>
            console.log(`[api] running on http://0.0.0.0:${PORT}`)
        );
    } catch (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
})();

module.exports = app;

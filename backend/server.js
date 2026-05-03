require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");

const app = express();

// ✅ CORS
app.use(cors({
    origin: [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://ethara-ai-assignment-two.vercel.app"
    ],
    credentials: true,
}));

app.options("*", cors());

// ✅ Middleware
app.use(morgan("dev"));
app.use(express.json());

// ✅ Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

// ✅ Routes
app.use("/api/auth", authRoutes);

// ✅ PORT
const PORT = process.env.PORT || 5001;

// ✅ Start server WITH DB connection
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
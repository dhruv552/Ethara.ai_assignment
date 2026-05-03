const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

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

app.use(morgan("dev"));
app.use(express.json());

// ✅ Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

// ✅ AUTH ROUTES (IMPORTANT)
app.use("/api/auth", authRoutes);

// ✅ Start server
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
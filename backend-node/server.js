require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const taskRoutes = require("./routes/tasks");
const miscRoutes = require("./routes/misc");
const User = require("./models/User");
const Project = require("./models/Project");
const Task = require("./models/Task");

const app = express();
app.use(express.json());
app.use(
    cors({
        origin: process.env.CLIENT_URL || "*",
        credentials: true,
    })
);

app.get("/api", (_req, res) =>
    res.json({ service: "team-task-manager", ok: true })
);

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api", miscRoutes);

// Global error handler
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
});

async function ensureUser(name, email, password, role) {
    let user = await User.findOne({ email });
    if (!user) {
        const hash = await bcrypt.hash(password, 10);
        user = await User.create({ name, email, password: hash, role });
        console.log(`[seed] created ${email} (${role})`);
    } else {
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
            user.password = await bcrypt.hash(password, 10);
            await user.save();
        }
    }
    return user;
}

async function seed() {
    const admin = await ensureUser(
        "Admin User",
        process.env.ADMIN_EMAIL || "admin@example.com",
        process.env.ADMIN_PASSWORD || "admin123",
        "admin"
    );
    const member = await ensureUser(
        "Team Member",
        process.env.MEMBER_EMAIL || "member@example.com",
        process.env.MEMBER_PASSWORD || "member123",
        "member"
    );

    if ((await Project.countDocuments()) === 0) {
        const project = await Project.create({
            name: "Website Relaunch",
            description: "Rebuild marketing site with new brand system.",
            createdBy: admin._id,
            members: [admin._id, member._id],
        });
        const today = new Date();
        const fmt = (d) => d.toISOString().slice(0, 10);
        const plus = (days) => {
            const d = new Date(today);
            d.setDate(d.getDate() + days);
            return fmt(d);
        };
        await Task.insertMany([
            {
                title: "Audit current site",
                description: "Inventory pages and content gaps.",
                projectId: project._id,
                assignedTo: admin._id,
                status: "done",
                dueDate: plus(-2),
                createdBy: admin._id,
            },
            {
                title: "Design system tokens",
                description: "Define type, color, spacing tokens.",
                projectId: project._id,
                assignedTo: member._id,
                status: "in-progress",
                dueDate: plus(3),
                createdBy: admin._id,
            },
            {
                title: "Build homepage hero",
                description: "Implement responsive hero section.",
                projectId: project._id,
                assignedTo: member._id,
                status: "todo",
                dueDate: plus(7),
                createdBy: admin._id,
            },
            {
                title: "Migrate blog posts",
                description: "Move existing blog content to CMS.",
                projectId: project._id,
                assignedTo: null,
                status: "todo",
                dueDate: plus(-1),
                createdBy: admin._id,
            },
        ]);
        console.log("[seed] created starter project + tasks");
    }
}

const PORT = process.env.PORT || 5000;

(async () => {
    try {
        await connectDB();
        await seed();
        app.listen(PORT, () =>
            console.log(`[api] running on http://localhost:${PORT}`)
        );
    } catch (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
})();

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const User = require("../models/User");
const Project = require("../models/Project");
const Task = require("../models/Task");

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
            console.log(`[seed] reset password for ${email}`);
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

module.exports = seed;

if (require.main === module) {
    (async () => {
        try {
            await connectDB();
            await seed();
            console.log("[seed] done");
            process.exit(0);
        } catch (e) {
            console.error(e);
            process.exit(1);
        }
    })();
}

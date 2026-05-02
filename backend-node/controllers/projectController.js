const Project = require("../models/Project");
const Task = require("../models/Task");
const User = require("../models/User");

function canView(user, project) {
    if (user.role === "admin") return true;
    const ids = (project.members || []).map((m) => m.toString());
    return (
        ids.includes(user._id.toString()) ||
        project.createdBy.toString() === user._id.toString()
    );
}

exports.create = async (req, res) => {
    const { name, description = "" } = req.body || {};
    if (!name) return res.status(400).json({ detail: "name is required" });
    const project = await Project.create({
        name: name.trim(),
        description: description.trim(),
        createdBy: req.user._id,
        members: [req.user._id],
    });
    return res.json(project.toPublic());
};

exports.list = async (req, res) => {
    const filter =
        req.user.role === "admin"
            ? {}
            : {
                  $or: [
                      { members: req.user._id },
                      { createdBy: req.user._id },
                  ],
              };
    const projects = await Project.find(filter).sort({ createdAt: -1 });
    return res.json(projects.map((p) => p.toPublic()));
};

exports.get = async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ detail: "Project not found" });
    if (!canView(req.user, project)) {
        return res.status(403).json({ detail: "Forbidden" });
    }
    return res.json(project.toPublic());
};

exports.update = async (req, res) => {
    const { name, description } = req.body || {};
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ detail: "Project not found" });
    if (typeof name === "string") project.name = name.trim();
    if (typeof description === "string")
        project.description = description.trim();
    await project.save();
    return res.json(project.toPublic());
};

exports.remove = async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ detail: "Project not found" });
    await Task.deleteMany({ projectId: project._id });
    await project.deleteOne();
    return res.json({ ok: true });
};

exports.addMember = async (req, res) => {
    const { user_id } = req.body || {};
    if (!user_id) return res.status(400).json({ detail: "user_id required" });
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ detail: "Project not found" });
    const target = await User.findById(user_id);
    if (!target) return res.status(404).json({ detail: "User not found" });
    if (!project.members.some((m) => m.toString() === user_id)) {
        project.members.push(target._id);
        await project.save();
    }
    return res.json(project.toPublic());
};

exports.removeMember = async (req, res) => {
    const { id, userId } = req.params;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ detail: "Project not found" });
    project.members = project.members.filter((m) => m.toString() !== userId);
    await project.save();
    return res.json(project.toPublic());
};

// Helper exposed for task controller
exports._canView = canView;

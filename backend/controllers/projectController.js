const Project = require("../models/Project");
const Task = require("../models/Task");
const User = require("../models/User");

function canView(user, project) {
    if (!user) return false;
    if (user.role === "admin") return true;
    const ids = (project.members || []).map((m) => m.toString());
    return (
        ids.includes(user._id.toString()) ||
        project.createdBy.toString() === user._id.toString()
    );
}

exports.create = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ detail: "Not authenticated" });
        }
        
        const { name, description = "" } = req.body || {};
        if (!name) {
            return res.status(400).json({ detail: "name is required" });
        }
        
        const project = await Project.create({
            name: name.trim(),
            description: description.trim(),
            createdBy: req.user._id,
            members: [req.user._id],
        });
        
        return res.json(project.toPublic());
    } catch (err) {
        console.error("[projects.create]", err.message);
        err.status = 500;
        next(err);
    }
};

exports.list = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ detail: "Not authenticated" });
        }
        
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
    } catch (err) {
        console.error("[projects.list]", err.message);
        err.status = 500;
        next(err);
    }
};

exports.get = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ detail: "Not authenticated" });
        }
        
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ detail: "Project not found" });
        }
        
        if (!canView(req.user, project)) {
            return res.status(403).json({ detail: "Forbidden" });
        }
        
        return res.json(project.toPublic());
    } catch (err) {
        console.error("[projects.get]", err.message);
        err.status = 500;
        next(err);
    }
};

exports.update = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ detail: "Not authenticated" });
        }
        
        const { name, description } = req.body || {};
        const project = await Project.findById(req.params.id);
        
        if (!project) {
            return res.status(404).json({ detail: "Project not found" });
        }
        
        if (typeof name === "string") project.name = name.trim();
        if (typeof description === "string")
            project.description = description.trim();
        
        await project.save();
        return res.json(project.toPublic());
    } catch (err) {
        console.error("[projects.update]", err.message);
        err.status = 500;
        next(err);
    }
};

exports.remove = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ detail: "Not authenticated" });
        }
        
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ detail: "Project not found" });
        }
        
        await Task.deleteMany({ projectId: project._id });
        await project.deleteOne();
        
        return res.json({ ok: true });
    } catch (err) {
        console.error("[projects.remove]", err.message);
        err.status = 500;
        next(err);
    }
};

exports.addMember = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ detail: "Not authenticated" });
        }
        
        const { user_id } = req.body || {};
        if (!user_id) {
            return res.status(400).json({ detail: "user_id required" });
        }
        
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ detail: "Project not found" });
        }
        
        const target = await User.findById(user_id);
        if (!target) {
            return res.status(404).json({ detail: "User not found" });
        }
        
        if (!project.members.some((m) => m.toString() === user_id)) {
            project.members.push(target._id);
            await project.save();
        }
        
        return res.json(project.toPublic());
    } catch (err) {
        console.error("[projects.addMember]", err.message);
        err.status = 500;
        next(err);
    }
};

exports.removeMember = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ detail: "Not authenticated" });
        }
        
        const { id, userId } = req.params;
        const project = await Project.findById(id);
        
        if (!project) {
            return res.status(404).json({ detail: "Project not found" });
        }
        
        project.members = project.members.filter((m) => m.toString() !== userId);
        await project.save();
        
        return res.json(project.toPublic());
    } catch (err) {
        console.error("[projects.removeMember]", err.message);
        err.status = 500;
        next(err);
    }
};

exports._canView = canView;
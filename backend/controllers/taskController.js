const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");
const { _canView } = require("./projectController");

exports.create = async (req, res) => {
    const {
        title,
        description = "",
        project_id,
        assigned_to = null,
        due_date = null,
        status = "todo",
    } = req.body || {};
    if (!title || !project_id) {
        return res
            .status(400)
            .json({ detail: "title and project_id are required" });
    }
    const project = await Project.findById(project_id);
    if (!project) return res.status(404).json({ detail: "Project not found" });

    let assignee = null;
    if (assigned_to) {
        assignee = await User.findById(assigned_to);
        if (!assignee) {
            return res.status(404).json({ detail: "Assignee not found" });
        }
        if (
            !project.members.some(
                (m) => m.toString() === assignee._id.toString()
            )
        ) {
            project.members.push(assignee._id);
            await project.save();
        }
    }

    const task = await Task.create({
        title: title.trim(),
        description: (description || "").trim(),
        projectId: project._id,
        assignedTo: assignee ? assignee._id : null,
        status,
        dueDate: due_date,
        createdBy: req.user._id,
    });
    return res.json(task.toPublic());
};

exports.listByProject = async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ detail: "Project not found" });
    if (!_canView(req.user, project)) {
        return res.status(403).json({ detail: "Forbidden" });
    }
    const tasks = await Task.find({ projectId: project._id }).sort({
        createdAt: -1,
    });
    return res.json(tasks.map((t) => t.toPublic()));
};

exports.listMine = async (req, res) => {
    const tasks = await Task.find({ assignedTo: req.user._id }).sort({
        createdAt: -1,
    });
    return res.json(tasks.map((t) => t.toPublic()));
};

exports.update = async (req, res) => {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ detail: "Task not found" });
    const isAdmin = req.user.role === "admin";
    const isAssignee =
        task.assignedTo &&
        task.assignedTo.toString() === req.user._id.toString();
    if (!isAdmin && !isAssignee) {
        return res.status(403).json({ detail: "Forbidden" });
    }

    const body = req.body || {};
    if (isAdmin) {
        if (typeof body.title === "string") task.title = body.title.trim();
        if (typeof body.description === "string")
            task.description = body.description.trim();
        if ("assigned_to" in body) task.assignedTo = body.assigned_to || null;
        if ("due_date" in body) task.dueDate = body.due_date || null;
    }
    if (typeof body.status === "string") task.status = body.status;
    await task.save();
    return res.json(task.toPublic());
};

exports.remove = async (req, res) => {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ detail: "Task not found" });
    await task.deleteOne();
    return res.json({ ok: true });
};

exports.dashboardStats = async (req, res) => {
    const isAdmin = req.user.role === "admin";
    let projectFilter = {};
    let taskFilter = {};
    if (!isAdmin) {
        const projects = await Project.find({
            $or: [{ members: req.user._id }, { createdBy: req.user._id }],
        }).select("_id");
        const ids = projects.map((p) => p._id);
        projectFilter = { _id: { $in: ids } };
        taskFilter = {
            $or: [
                { assignedTo: req.user._id },
                { projectId: { $in: ids } },
            ],
        };
    }

    const today = new Date().toISOString().slice(0, 10);

    const [
        total_projects,
        total_tasks,
        completed_tasks,
        in_progress_tasks,
        overdue_tasks,
        my_open_tasks,
    ] = await Promise.all([
        Project.countDocuments(projectFilter),
        Task.countDocuments(taskFilter),
        Task.countDocuments({ ...taskFilter, status: "done" }),
        Task.countDocuments({ ...taskFilter, status: "in-progress" }),
        Task.countDocuments({
            ...taskFilter,
            status: { $ne: "done" },
            dueDate: { $lt: today, $ne: null },
        }),
        Task.countDocuments({
            assignedTo: req.user._id,
            status: { $ne: "done" },
        }),
    ]);

    return res.json({
        total_projects,
        total_tasks,
        completed_tasks,
        in_progress_tasks,
        overdue_tasks,
        my_open_tasks,
    });
};

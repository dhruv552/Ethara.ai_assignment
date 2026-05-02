const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, default: "", trim: true },
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        status: {
            type: String,
            enum: ["todo", "in-progress", "done"],
            default: "todo",
        },
        dueDate: { type: String, default: null }, // ISO yyyy-mm-dd
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

taskSchema.methods.toPublic = function () {
    return {
        id: this._id.toString(),
        title: this.title,
        description: this.description,
        project_id: this.projectId.toString(),
        assigned_to: this.assignedTo ? this.assignedTo.toString() : null,
        status: this.status,
        due_date: this.dueDate,
        created_by: this.createdBy.toString(),
        created_at: this.createdAt,
    };
};

module.exports = mongoose.model("Task", taskSchema);

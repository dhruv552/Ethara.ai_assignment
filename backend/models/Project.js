const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, default: "", trim: true },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true }
);

projectSchema.methods.toPublic = function () {
    return {
        id: this._id.toString(),
        name: this.name,
        description: this.description,
        created_by: this.createdBy.toString(),
        members: (this.members || []).map((m) => m.toString()),
        created_at: this.createdAt,
    };
};

module.exports = mongoose.model("Project", projectSchema);

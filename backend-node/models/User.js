const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: { type: String, required: true },
        role: {
            type: String,
            enum: ["admin", "member"],
            default: "member",
        },
    },
    { timestamps: true }
);

userSchema.methods.toPublic = function () {
    return {
        id: this._id.toString(),
        name: this.name,
        email: this.email,
        role: this.role,
        created_at: this.createdAt,
    };
};

module.exports = mongoose.model("User", userSchema);

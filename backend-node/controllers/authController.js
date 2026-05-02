const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const TOKEN_TTL_DAYS = 7;

function signToken(user) {
    return jwt.sign(
        {
            sub: user._id.toString(),
            email: user.email,
            role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: `${TOKEN_TTL_DAYS}d` }
    );
}

exports.signup = async (req, res) => {
    try {
        const { name, email, password, role } = req.body || {};
        if (!name || !email || !password) {
            return res
                .status(400)
                .json({ detail: "name, email, and password are required" });
        }
        if (password.length < 6) {
            return res
                .status(400)
                .json({ detail: "Password must be at least 6 characters" });
        }
        const normalized = email.toLowerCase().trim();
        const existing = await User.findOne({ email: normalized });
        if (existing) {
            return res.status(400).json({ detail: "Email already registered" });
        }
        const hash = await bcrypt.hash(password, 10);
        const user = await User.create({
            name: name.trim(),
            email: normalized,
            password: hash,
            role: role === "admin" ? "admin" : "member",
        });
        return res.json({ token: signToken(user), user: user.toPublic() });
    } catch (err) {
        console.error("signup error", err);
        return res.status(500).json({ detail: "Internal server error" });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res
                .status(400)
                .json({ detail: "email and password are required" });
        }
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res
                .status(401)
                .json({ detail: "Invalid email or password" });
        }
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
            return res
                .status(401)
                .json({ detail: "Invalid email or password" });
        }
        return res.json({ token: signToken(user), user: user.toPublic() });
    } catch (err) {
        console.error("login error", err);
        return res.status(500).json({ detail: "Internal server error" });
    }
};

exports.me = async (req, res) => {
    return res.json(req.user.toPublic());
};

exports.logout = async (_req, res) => {
    // Stateless JWT — client just discards the token.
    return res.json({ ok: true });
};

exports.listUsers = async (_req, res) => {
    const users = await User.find().select("-password");
    return res.json(users.map((u) => u.toPublic()));
};

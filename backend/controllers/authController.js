const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function signToken(user) {
    return jwt.sign(
        {
            sub: user._id.toString(),
            email: user.email,
            role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
}

exports.signup = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body || {};
        
        if (!name || !email || !password) {
            return res.status(400).json({
                detail: "name, email, and password are required",
            });
        }
        
        if (password.length < 6) {
            return res.status(400).json({
                detail: "Password must be at least 6 characters",
            });
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
        console.error("[auth.signup]", err.message);
        err.status = 500;
        next(err);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body || {};
        
        if (!email || !password) {
            return res.status(400).json({
                detail: "email and password are required",
            });
        }
        
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({
                detail: "Invalid email or password",
            });
        }
        
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
            return res.status(401).json({
                detail: "Invalid email or password",
            });
        }
        
        return res.json({ token: signToken(user), user: user.toPublic() });
    } catch (err) {
        console.error("[auth.login]", err.message);
        err.status = 500;
        next(err);
    }
};

exports.me = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ detail: "Not authenticated" });
        }
        
        return res.json(req.user.toPublic());
    } catch (err) {
        console.error("[auth.me]", err.message);
        err.status = 500;
        next(err);
    }
};

exports.logout = async (req, res, next) => {
    try {
        return res.json({ ok: true });
    } catch (err) {
        console.error("[auth.logout]", err.message);
        err.status = 500;
        next(err);
    }
};

exports.listUsers = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ detail: "Not authenticated" });
        }
        
        const users = await User.find().select("-password").sort({ name: 1 });
        return res.json(users.map((u) => u.toPublic()));
    } catch (err) {
        console.error("[auth.listUsers]", err.message);
        err.status = 500;
        next(err);
    }
};
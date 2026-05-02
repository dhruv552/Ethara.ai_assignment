const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function auth(req, res, next) {
    try {
        const header = req.headers.authorization || "";
        const token = header.startsWith("Bearer ") ? header.slice(7) : null;
        
        if (!token) {
            return res.status(401).json({ detail: "Not authenticated" });
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(payload.sub).select("-password");
        
        if (!user) {
            return res.status(401).json({ detail: "User not found" });
        }

        req.user = user;
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ detail: "Token expired" });
        }
        if (err.name === "JsonWebTokenError") {
            return res.status(401).json({ detail: "Invalid token" });
        }
        // Pass to error handler
        err.status = 401;
        next(err);
    }
}

module.exports = auth;
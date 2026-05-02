function requireRole(role) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ detail: "Not authenticated" });
        }
        if (req.user.role !== role) {
            return res
                .status(403)
                .json({ detail: `${role} access required` });
        }
        next();
    };
}

module.exports = { requireRole, requireAdmin: requireRole("admin") };

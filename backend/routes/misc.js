const router = require("express").Router();
const auth = require("../middleware/auth");
const c = require("../controllers/authController");
const t = require("../controllers/taskController");

router.use(auth);
router.get("/users", c.listUsers);
router.get("/dashboard/stats", t.dashboardStats);

module.exports = router;

const router = require("express").Router();
const auth = require("../middleware/auth");
const { requireAdmin } = require("../middleware/roleCheck");
const c = require("../controllers/projectController");

router.use(auth);
router.post("/", requireAdmin, c.create);
router.get("/", c.list);
router.get("/:id", c.get);
router.put("/:id", requireAdmin, c.update);
router.delete("/:id", requireAdmin, c.remove);
router.post("/:id/members", requireAdmin, c.addMember);
router.delete("/:id/members/:userId", requireAdmin, c.removeMember);

module.exports = router;

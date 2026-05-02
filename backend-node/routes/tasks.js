const router = require("express").Router();
const auth = require("../middleware/auth");
const { requireAdmin } = require("../middleware/roleCheck");
const c = require("../controllers/taskController");

router.use(auth);
router.post("/", requireAdmin, c.create);
router.get("/mine", c.listMine);
router.get("/project/:id", c.listByProject);
router.put("/:id", c.update);
router.delete("/:id", requireAdmin, c.remove);

module.exports = router;

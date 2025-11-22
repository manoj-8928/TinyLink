const express = require("express");
const router = express.Router();
const links = require("../controllers/links");

router.get("/", links.renderDashboard);
router.post("/create", links.handleCreateFromForm);
router.get("/code/:code", links.renderStatsPage);
router.get("/healthz", (req, res) => res.status(200).json({ ok: true, version: "1.0" }));
router.get("/:code", links.redirectByCode);
// router.delete("/:code", links.deleteLink);

module.exports = router;

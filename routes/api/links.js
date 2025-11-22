const express = require("express");
const router = express.Router();
const links = require("../../controllers/links");

router.post("/", links.createLink);
router.get("/", links.listLinks);
router.get("/:code", links.getLink);
router.delete("/:code",links.deleteLink);

module.exports = router;

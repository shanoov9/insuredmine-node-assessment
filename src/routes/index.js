const express = require("express");

const uploadRoutes = require("./upload.routes");
const policyRoutes = require("./policy.routes");
const messageRoutes = require("./message.routes");

// Central router that mounts all application route groups.
const router = express.Router();

router.use("/upload", uploadRoutes);
router.use("/policies", policyRoutes);
router.use("/messages", messageRoutes);

module.exports = router;

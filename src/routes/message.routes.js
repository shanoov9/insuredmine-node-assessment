const express = require("express");
const { scheduleMessage } = require("../controllers/message.controller");

// Defines endpoints for creating scheduled messages.
const router = express.Router();

router.post("/schedule", scheduleMessage);

module.exports = router;

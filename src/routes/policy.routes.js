const express = require("express");
const {
  getPoliciesByUsername,
  aggregatePoliciesByUser
} = require("../controllers/policy.controller");

// Defines policy search and policy aggregation endpoints.
const router = express.Router();

router.get("/user/:username", getPoliciesByUsername);
router.get("/aggregate", aggregatePoliciesByUser);

module.exports = router;

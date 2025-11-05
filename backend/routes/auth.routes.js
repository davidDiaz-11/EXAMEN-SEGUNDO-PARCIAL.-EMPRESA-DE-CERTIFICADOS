const express = require("express");
const { login, logout, getProfile } = require("../controllers/auth.Controller");
const { verifyToken } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/login", login);
router.post("/logout", verifyToken, logout);
router.get("/profile", verifyToken, getProfile);

module.exports = router;
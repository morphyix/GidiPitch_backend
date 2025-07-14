const express = require("express");
const router = express.Router();

const {
    createResume,
    getResume,
    getMyResume,
    updateResume,
    deleteResume
} = require("../controllers/resumeController");

const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/", authMiddleware, createResume);
router.get("/", authMiddleware, getMyResume);
router.get("/:id", authMiddleware, getResume);
router.put("/:id", authMiddleware, updateResume);
router.delete("/:id", authMiddleware, deleteResume);

module.exports = router;
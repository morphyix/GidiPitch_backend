const express = require("express");
const router = express.Router();

const resumeController = require("../controllers/resumeController");

const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/", authMiddleware, resumeController.createResume);
router.get("/", authMiddleware, resumeController.getMyResumes);
router.get("/:id", authMiddleware, resumeController.getResume);
router.put("/:id", authMiddleware, resumeController.updateResume);
router.delete("/:id", authMiddleware, resumeController.deleteResume);

module.exports = router;
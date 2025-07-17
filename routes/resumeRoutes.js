const express = require("express");
const router = express.Router();
const {
  createResume,
  getResume,
  getMyResumes,
  updateResume,
  deleteResume,
  exportResumePDF
} = require("../controllers/resumeController");

const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/", authMiddleware, createResume);
router.get("/", authMiddleware, getMyResumes); 
router.get("/:id", authMiddleware, getResume);
router.put("/:id", authMiddleware, updateResume);
router.get("/:id/export", authMiddleware, exportResumePDF);
router.delete("/:id", authMiddleware, deleteResume);

module.exports = router;
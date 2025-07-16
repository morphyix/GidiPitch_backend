const Resume = require("../models/Resume");
const PDFDocument = require("pdfkit");

// Create Resume
const createResume = async (req, res) => {
  try {
    const {
      bio,
      skills,
      startupStory,
      template,
      fullName,
      title,
      education,
      links
    } = req.body;

    const resume = new Resume({
      userId: req.user.id,
      bio,
      skills,
      startupStory,
      template: template || "basic",
      fullName,
      title,
      education,
      links,
    });

    const savedResume = await resume.save();

    res.status(201).json({
      message: "Resume created successfully",
      data: savedResume,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get resume by ID
const getResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    res.status(200).json({
      message: "Resume fetched successfully",
      data: resume,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all resumes for logged-in user
const getMyResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user.id });

    res.status(200).json({
      message: "Resumes fetched successfully",
      data: resumes,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update resume
const updateResume = async (req, res) => {
  try {
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );

    if (!resume) {
      return res
        .status(404)
        .json({ message: "Resume not found or unauthorized" });
    }

    res.status(200).json({
      message: "Resume updated successfully",
      data: resume,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete resume
const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!resume) {
      return res
        .status(404)
        .json({ message: "Resume not found or unauthorized" });
    }

    res.status(200).json({ message: "Resume deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Export resume as PDF
const exportResumePDF = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${(resume.fullName || "Resume").replace(/ /g, "_")}_Resume.pdf"`
    );

    const doc = new PDFDocument();
    doc.pipe(res);

    // Title
    doc.fontSize(22).text(resume.fullName || "No Name Provided", {
      underline: true,
    });
    doc.fontSize(16).text(resume.title || "No Title Provided");
    doc.moveDown();

    // Bio
    if (resume.bio) {
      doc.fontSize(14).text(resume.bio);
      doc.moveDown();
    }

    // Skills
    if (Array.isArray(resume.skills) && resume.skills.length > 0) {
      doc.fontSize(16).text("Skills:", { underline: true });
      doc.fontSize(14).text(resume.skills.join(", "));
      doc.moveDown();
    }

    // Startups
    if (
      Array.isArray(resume.startupStory) &&
      resume.startupStory.length > 0
    ) {
      doc.fontSize(16).text("Startups:", { underline: true });
      resume.startupStory.forEach((startup) => {
        doc.fontSize(14).text(`${startup.name} - ${startup.role}`);
        doc.text(startup.description || "");
        doc.text(`Traction: ${startup.traction || "N/A"}`);
        doc.moveDown();
      });
    }

    // Education
    if (Array.isArray(resume.education) && resume.education.length > 0) {
      doc.fontSize(16).text("Education:", { underline: true });
      resume.education.forEach((edu) => {
        doc
          .fontSize(14)
          .text(`${edu.degree} in ${edu.field} - ${edu.school} (${edu.year})`);
      });
      doc.moveDown();
    }

    // Links
    if (resume.links) {
      const links = resume.links;
      doc.fontSize(16).text("Links:", { underline: true });
      if (links.linkedIn) doc.text(`LinkedIn: ${links.linkedIn}`);
      if (links.github) doc.text(`GitHub: ${links.github}`);
      if (links.website) doc.text(`Website: ${links.website}`);
      if (links.pitchDeckUrl) doc.text(`Pitch Deck: ${links.pitchDeckUrl}`);
    }

    doc.end();
  } catch (error) {
    console.error("PDF export failed:", error.message);
    res.status(500).json({ message: "Failed to generate PDF" });
  }
};

// Export all controller functions
module.exports = {
  createResume,
  getResume,
  getMyResumes,
  updateResume,
  deleteResume,
  exportResumePDF,
};

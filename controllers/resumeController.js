const Resume = require("../models/Resume");
const PDFDocument = require("pdfkit")
// Create resume

exports.createResume = async (req, res) => {
    try{
        const {bio, skills, startupStory, template} = req.body;

        const resume= new Resume ({
            userId: req.user.id,
            bio,
            skills,
            startupStory,
            template: template || "basic"
        });

        const savedResume = await resume.save();

        res.status(201).json({
            message: "Resume created Successfully",
            data: savedResume
        });
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

// Get resume by ID
exports.getResume = async (req, res) => {
    try {
        const resume = await Resume.findById(req.params.id);

        if (!resume) {
            return 
            res.status(404).json({message: "Resume not found"});
        }

        res.status(200).json({
            messamessage: "Resume fetched successfully",
            data: resume
        });
    } catch (error){
        res.status(500).json
({error: error.message});
}
};

// Get resume for all logged-in user
exports.getMyResumes = async (req, res) => {
    try {
        const resumes = await Resume.find({ userId: req.user.id});
        res.status (200).json({
            message: "Resume fetched successfully",
            data: resumes
        });
    } catch (error){
        res.status(500).json({error: error.message});
    }
};

// update resume
exports.updateResume = async (req, res) => {
    try{
        const resume = await Resume.findOneAndUpdate({
            _id: req.params.id, userId: req.user.id
        }, 
    req.body,
    {new: true}
    );

    if (!resume) {
        return 
        res.status(404).json({
            message :"Resume not found or unauthorized", });
        } 
        res.status(200).json({
            message:"Resume updated successfully",
            data : resume
        });
      } catch (error) {
            res.status(500).json({error: error.message});
        }
    };

    // delete resume
    exports.deleteResume = async (req, res) => {
        try {
            const resume = await Resume.findOneAndDelete({
                _id: req.params.id,
                userId: req.user.id
            });

            if (!resume) {
                return
                res.status(404).json({message: "Resume not found or Unauthorized"});
            }

            res.status(200).json({
                message: "Resume deleted successfully"
            });
        } catch (error) {
            res.status(500).json({error: error.message});
        }
    };

    exports.exportResumePDF = async (req, res) => {
        try {
            const resume = await Resume.findById(req.params.id);

            if (!resume) {
                return
                res.status(404).json({message: "Resume not found"});
            }

            // Headers
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${resume.fullname.replace(/ /g, "_")}_Resume.pdf"`
            );

            // Create Pdf
            const doc = new PDFDocument();
            doc.pipe(res);

            //Title

            doc.fontSize(22).text(resume.fullName, {underline: true});
            doc.fontSize(16).text(resume.title);
            doc.moveDown;

            //Bio
            doc.fontSize(14).text(resume.bio);
            doc.moveDown();

            //Skills
            doc.fontSize(16).text("Skills:", {underline: true});

            doc.fontSize(14).text(resume.skills.join(", "))
            doc.moveDown();

            //Stratups
            if (resume.startups.length > 0) {
                doc.fontSize(16).text("Startups:", {underline: true});
                resume.startupStory.forEach((startup) => {
                    doc.fontSize(14).text(`${startup.name} - ${startup.role}`);
                    
                    doc.text(startup.description);
                    doc.text(`Traction: ${startup.traction}`);
                    doc.moveDown();
                });
            }

            //Education
            if (resume.education.length > 0) {
                doc.fontsize(16).text("Education:", {underline: true});
                resume.education.forEach((edu) => {
                    doc.text(`${edu.degree} in ${edu.field} - ${edu.school} (${edu.year})`);
                });
                doc.moveDown();
            }

            //Links
            const links = resume.links || {};
            doc.fontSize(16).text("Links:", {underline: true});
            if(links.linkedIn)
                doc.text(`Linkedin: ${links.linkedIn}`);
            if(links.github)
                doc.text(`Github: ${links.github}`);
            if(links.website)
                doc.text(`Website: ${links.website}`);
            if(links.pitchDeckUrl)
                doc.text(`Pitch Deck : ${links.pitchDeckUrl}`);

            doc.end();
        } catch (error) {
            console.error("PDF export failed:", error.message);
            res.status(500).json({message: "Failed to generate PDF"});
        }
    };
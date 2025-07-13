const Resume = require("../models/Resume");
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
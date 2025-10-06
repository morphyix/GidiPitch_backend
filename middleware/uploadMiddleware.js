// import required modules
const multer = require('multer');
const dotenv = require('dotenv');

// load environment variables
dotenv.config();


// create a multer storage engine
const storage = multer.memoryStorage();


const upload = multer({
    storage,
    limits: {
        fileSize: 1024 * 1024 * 5, // 5 MB
    },
});


module.exports = upload;
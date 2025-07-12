// module to hash and verify hashed strings and tokens using SHA-256
const crypto = require('crypto');
const { AppError } = require('./error');


const hashString = (input) => {
    try {
        // Create a SHA-256 hash of the input string
        const hash = crypto.createHash('sha256');
        hash.update(input);
        return hash.digest('hex'); // Return the hash in hexadecimal format
    } catch (error) {
        console.error('Error hashing string:', error);
        throw new AppError('Error hashing string', 500); // Handle errors gracefully 
    }
};


// Export the hashString function
module.exports = {
    hashString
};
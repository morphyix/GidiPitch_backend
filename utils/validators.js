// Validate form input data module


// validate email format
const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
};


// validate phone number format for Nigeian Clients
const validatePhone = (phone) => {
    const regex = /^(\+234|0)[789][01]\d{8}$/;
    return regex.test(phone);
};

// validate password strength
const validatePassword = (password) => {
    // password must be 8 characters long, contain an uppecase, lowercase, a number and a special character
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    return regex.test(password);
};


// validate gender and return normalized value
const validateGender = (gender) => {
    const validGenders = ['male', 'female', 'Male', 'Female'];
    if (validGenders.includes(gender)) {
        return gender.toLowerCase();
    }
    return null;
};


module.exports = {
    validateEmail,
    validatePhone,
    validatePassword,
    validateGender
};
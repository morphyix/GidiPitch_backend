const express = require('express');
const { addToWaitListController, getWaitListCountController } = require('../controllers/waitListController');

const router = express.Router();


// WaitList Routes
router.post('/add', addToWaitListController);
router.get('/count', getWaitListCountController);


// Export the router
module.exports = router;
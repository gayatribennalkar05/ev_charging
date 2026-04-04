const express = require('express');
const router = express.Router();
const { getStations, getSlots } = require('../controllers/stationController');
const { rateLimiter } = require('../middleware/security');

router.get('/stations', rateLimiter, getStations);
router.get('/slots', rateLimiter, getSlots);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getMenuData } = require('../controllers/publicController');

router.get('/menu/:tenantId', getMenuData);

module.exports = router;

const express = require('express');
const { loginCustomer, registerCustomer } = require('../controllers/authCustomerController');
const router = express.Router();

router.post('/login', loginCustomer);
router.post('/register', registerCustomer);

module.exports = router;

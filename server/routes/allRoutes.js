const express = require('express');
const router = express.Router();

const productsRoutes = require('./products.router.js');

router.use('/products', productsRoutes);

module.exports = router;
const express = require('express');
const router = express.Router();

const productsController = require("../controllers/products.controller");

// get all products
router.get('/', productsController.getAllProducts);

module.exports = router;

'user strict';

const productsService = require("../services/products.service");

// Fetch all products
exports.getAllProducts = async (req, res) => {
      try {
        const products = await productsService.getAllProducts();
        console.log(products)
        return res.status(200).send(products);
      } catch (e) {
        console.log(e);
      }
}
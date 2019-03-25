const Product = require("../models/product");

exports.getAllProducts = async () => {
    try 
    {
      const p = new Product();
      const products = await p.getAllProducts();
      return products;
    } catch (e) {
      console.log(e,"ERROR FROM SERVICES")
    }
  }
// src/services/product.js

const productModel = require('./product');

/**
 * Stores a new product into the database.
 * @param {Object} product product object to create.
 * @throws {Error} If the product is not provided.
 */
module.exports.create = (product) => {
    return productModel.create(product);
}

module.exports.getByName = (name) => {
    return productModel.find({name});
}
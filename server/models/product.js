'user strict';

const db = require('../config/database');
const DbWrapper = require("../db_wrapper/db_wrapper");

class Product {

    constructor(Name, Code, CategoryId, Price, DiscountedPrice, DateSet) {
        this.name = Name;
        this.code = Code;
        this.price = Price;
        this.discountedPrice = DiscountedPrice || 'N/A';
        this.category_id = CategoryId;
        this.dateSet = DateSet;
        this._dbWrapper = new DbWrapper();
        this.insertProductsAndPricesInDb();
    }

    insertProductsAndPricesInDb() {
         const query =
        `SET @p_id = 0; CALL insert_products_or_update_prices(@p_id,'${this.name}','${this.code}','${ this.category_id}','${this.price}','${this.discountedPrice}','${this.dateSet}'); SELECT @p_id`;

        this._dbWrapper.callStoreProcedure(query)
        .then(([, {
                affectedRows
            },
            [{
                "@p_id": productId
            }]
        ]) => {
            if (affectedRows && productId) {
                const priceData = [this.price, this.discountedPrice, this.dateSet, productId];
                this._dbWrapper.updateOrInsert('prices', '(?,?,?,?)', priceData)
                    .then(res => {})
            }
        }).catch(e => e, "ERR")
    }

    async getAllProducts() {
        try {
            const sql = `select * from products`;
            return await db.query(sql);

        } catch (err) {
            console.log(err, "ERROR")
        }
    }

    getById() {

    }
}

module.exports = Product;
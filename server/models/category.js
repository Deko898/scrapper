'user strict';
const DbWrapper = require("../db_wrapper/db_wrapper");

class Category {

    constructor(Name) {
        this.name = Name;
        this.dbWrapper = new DbWrapper();
    }

    async insert(name, websiteId) {
        // const sql = `SET @w_id = 0; CALL insert_products_or_update_prices(@w_id,'${name}','${code}','${category_id}','${price}','${discountedPrice}','${dateSet}'); SELECT @w_id`
        //return this.dbWrapper.updateOrInsert('websites', '(?)', [websiteUrl]);
        const query =
            `SET @c_id = 0; CALL get_category_id_or_insert_category(@c_id,'${name}','${websiteId}'); SELECT @c_id`
        return this.dbWrapper.callStoreProcedure(query);
    }

    async getById() {

    }
}

module.exports = Category;
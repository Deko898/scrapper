'user strict';
const DbWrapper = require("../db_wrapper/db_wrapper");

class Link {

    constructor() {
        this.dbWrapper = new DbWrapper();
    }

    async insert(url, image, dateSet, category_id) {
        // const sql = `SET @w_id = 0; CALL insert_products_or_update_prices(@w_id,'${name}','${code}','${Link_id}','${price}','${discountedPrice}','${dateSet}'); SELECT @w_id`
        //return this.dbWrapper.updateOrInsert('websites', '(?)', [websiteLink]);
        // const sql = `SET @w_id = 0; CALL insert_products_or_update_prices(@w_id,'${name}','${code}','${Link_id}','${price}','${discountedPrice}','${dateSet}'); SELECT @w_id`
        const sql = 'insert into urls(url,image,dateSet,category_id) values(?,?,?,?)';

        return this.dbWrapper.insert(sql,url, image, dateSet, category_id);
    }

    async getById() {

    }
}

module.exports = Link;
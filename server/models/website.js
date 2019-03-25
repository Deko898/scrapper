'user strict';
const DbWrapper = require("../db_wrapper/db_wrapper");

class Website {

    constructor(Name) {
        this.name = Name;
        this.dbWrapper = new DbWrapper();
    }

    async insert(websiteUrl) {
        // const sql = `SET @w_id = 0; CALL insert_products_or_update_prices(@w_id,'${name}','${code}','${category_id}','${price}','${discountedPrice}','${dateSet}'); SELECT @w_id`
        //return this.dbWrapper.updateOrInsert('websites', '(?)', [websiteUrl]);
        const query =
        `SET @w_id = 0; CALL get_website_id_or_insert_website(@w_id,'${websiteUrl}'); SELECT @w_id`
        return this.dbWrapper.callStoreProcedure(query);
    }

    async getAllWebsites() {
        try {
            const sql = `select * from websites`;
            return await db.query(sql);

        } catch (err) {
            console.log(err, "ERROR")
        }
    }

    async getById() {

    }

    async getByName() {
        try {
            const sql = `select * from websites`;
            return await db.query(sql);

        } catch (err) {
            console.log(err, "ERROR")
        }
    }
}

module.exports = Website;
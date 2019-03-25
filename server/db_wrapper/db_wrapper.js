const db = require('../config/database');


module.exports = class DbWrapper {

    constructor() {}

    async getFK(id, table, condition) {
        try {
            const sql = `select ${id} from ${table} where name = '${condition}'`;
            return await db.query(sql);
        } catch (err) {
            console.log(column, "ERROR")
        }
    }

    async updateOrInsert(sp_name, values, insertData) {
        try {
            const sql = `CALL update_or_insert_${sp_name}${values}`;
            return await db.query(sql, insertData);
        } catch (error) {
            console.log(error, insertData, "ERROR in updateOrInsert:", sp_name)
        }
    }

    async callStoreProcedure(sql) {
        try {
            return await db.query(sql);
        } catch (error) {
            console.log(error, "error from update_or_insert_categories1")
        }
    }

    async insert(sql, ...urlData) {
        try {
            return await db.query(sql, urlData);
        } catch (error) {
            console.log(error, "insert")
        }
    }
}
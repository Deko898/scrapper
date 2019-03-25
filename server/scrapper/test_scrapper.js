const cheerio = require('cheerio');
const chalk = require('chalk');
const axios = require("axios");

const INTERVAL = 10 * 60 * 1000;

const url = 'http://www.setec.mk/';
const schedule = require('node-schedule');
const date = new Date();
const today = date.getMonth().toString().length < 2 ? `0${date.getMonth()}` : date.getMonth();
const currentDate = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;

const Product = require("../models/product");
const db = require("../config/database");

var webshot = require('webshot');

const Screenshot = require('url-to-screenshot');


const insert = async (table, column) => {
    try {
        console.log("column", column)
        const sql = `INSERT INTO ${table} SET ?`;
        return await db.query(sql, column);

        // console.log(query)
    } catch (err) {
        console.log(column, "ERROR")
    }
}


const getFK = async (id, table, condition) => {
    try {
        const sql = `select ${id} from ${table} where name = '${condition}'`;
        return await db.query(sql);
    } catch (err) {
        console.log(column, "ERROR")
    }
}

const webScraper = async websiteUrl => {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        updateOrInsert('websites', '(?)', [websiteUrl])

        const categories = getCategories($, websiteUrl);

        handleContent(categories);

    } catch (err) {
        console.log(err, "ERROR FROM WEB SCRAPPER");
    }
}

const getCategories = ($, websiteUrl) => {
    const categories = [];
    $('.fade  > .with-sub-menu > a').each(function (i) {
        if (i > 8) return;
        else {
            if ($(this)["0"].attribs.href) {
                const url = `${websiteUrl}${$(this)["0"].attribs.href}&limit=100`;
                const categoryName = $(this).text().trim();

                categories.push({
                    url,
                    name: categoryName
                });
            }
        }

    });
    console.log(categories, "CATEGORIES")
    insertCategoriesInDb(categories, websiteUrl)
    return categories;
}

const insertCategoriesInDb = (categories, websiteUrl) => {
    getFK('website_id', 'websites', websiteUrl)
        .then(response => {
            const stringRes = JSON.stringify(response);
            const parsedRes = JSON.parse(stringRes);
            categories.forEach(category => {
                updateOrInsert('categories', '(?,?)', [category.name, parsedRes[0].website_id])
            });
        });
}

const handleContent = categories => {
    categories.forEach(category => {
        // setTimeout(() => {
        getWebsiteContent(category.url, category.name);
        //}, i * 1000);
    });
}

const scrapeContent = ($, category_id) => {
    $('.product > .right').each((i, el) => {
        // $(el).find('.price-old').text().trim() ?
        //     console.log($(el).find('.price-old').text().trim(), "OLD") :
        //     console.log($(el).find('.price').text().trim(), "JUST PRICE")
        
        const oldPrice = $(el).find('.price-old').text().trim();
        const price = oldPrice ? oldPrice : $(el).find('.price').text().trim();
        const product = {
            name: $(el).find('.name').text().trim(),
            code: $(el).find('.shifra').text().trim().split(':')[1].trim(),
            // image: $(el).find(".image > a > img").attr("src"),
            category_id,
            price,
            discountedPrice: $(el).find('.price-new').text().trim(),
            dateSet: currentDate
        }

        // const product = new Product(
        //     $(el).find('.name').text().trim(),
        //     $(el).find('.shifra').text().trim().split(':')[1].trim(),
        //     // image: $(el).find(".image > a > img").attr("src"),
        //     category_id,
        //     $(el).find('.price-old').text().trim(),
        //     $(el).find('.price-new').text().trim(),
        //     currentDate)

        insertProductsAndPricesInDb(Object.values(product))
    });
}

const insertProductsAndPricesInDb = (product, price) => {
    updateOrInsertP(product)
        .then(([, {
                affectedRows
            },
            [{
                "@p_id": productId
            }]
        ]) => {
            if (affectedRows && productId) {
                const priceData = [product.price, product.discountedPrice, product.dateSet, productId];
                updateOrInsert('prices', '(?,?,?,?)', priceData)
                    .then(res => {})
            }
        }).catch(e => e, "ERR")
}

const handleResponse = async ($, url, category) => {
    const categoryId = getFK('category_id', 'categories', category);
    categoryId.then(res => {
        const string = JSON.stringify(res);
        const json = JSON.parse(string);
        scrapeContent($, json[0].category_id)
    })
}

const getWebsiteContent = async (url, category) => {
    console.log(url, "URL")
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        await handleResponse($, url, category);

        if ($('.pagination').length) {
            const nextPageLink = $('.pagination').find('.active').next().find('a').attr('href');
            console.log(chalk.bold(`Url:${nextPageLink}`))
            if (!nextPageLink) {
                console.log("stopped")
                return false;
            }
            getWebsiteContent(nextPageLink, category);

        }
        console.log(chalk.bold(`Url:${url}`));
        // console.log(chalk.cyan(`  Scraping: ${nextPageLink},category:${category},length:${$('.product-item-container').length}`));

        // if (!nextPageLink) {
        //     console.log("stopped")
        //     return false;
        // }
        // getWebsiteContent(nextPageLink, category);

    } catch (error) {
        console.log(url, "URL", "ERROR FROM WEBSITE CONTENT")
    }
}

webScraper(url)
//getWebsiteContent('http://setec.mk/index.php?route=product/category&path=10004&limit=100', 'Таблет Компјутери')

const updateOrInsertP = async (insertData) => {
    //@p_id,'${product.name}','1','1','${product.price}','${product.discountedPrice}', '2019-11-11'
    try {
        const query =
            `SET @p_id = 0; CALL insert_products_or_update_prices(@p_id,'${insertData[0]}','${insertData[1]}','${insertData[2]}','${insertData[3]}','${insertData[4]}','${insertData[5]}'); SELECT @p_id`
        return await db.query(query);
    } catch (error) {
        console.log(error, "ERRRORRRRRRRR CCCCCCCCCCCCCBBBBB")
    }

}

const updateOrInsert = async (sp_name, values, insertData) => {
    try {
        const sql = `CALL update_or_insert_${sp_name}${values}`;
        return await db.query(sql, insertData);
    } catch (error) {
        console.log(insertData, "insert data")
        console.log(error, insertData, "ERROR:", sp_name)
    }
}


const product = {
    name: 'name1',
    price: '1006',
    discountedPrice: '996'
}
const testProcedure = async () => {

    try {
        const query =
            `SET @p_id = 0; CALL insert_products_or_update_prices(@p_id,'${product.name}','1','1','${product.price}','${product.discountedPrice}', '2019-11-11'); SELECT @p_id`
        return await db.query(query);
    } catch (error) {
        console.log(error, "ERROR IN TEST")
    }

}

// testProcedure()
//     .then(([, {
//             affectedRows
//         },
//         [{
//             "@p_id": productId
//         }]
//     ]) => {
//         if (affectedRows && productId) {
//             const priceData = [product.price, product.discountedPrice, '2019-11-11', productId];
//             updateOrInsert('prices', '(?,?,?,?)', priceData)
//                 .then(res => console.log(res))
//                 .catch(e => console.log(e, "EEEEEEEROOOR"))
//         }
//     }).catch(e => e, "ERR")
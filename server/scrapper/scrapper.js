const DbWrapper = require("../db_wrapper/db_wrapper");
const cheerio = require('cheerio');
const chalk = require('chalk');
const axios = require("axios");

const date = new Date();
const today = date.getMonth().toString().length < 2 ? `0${date.getMonth()}` : date.getMonth();
const currentDate = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
const scrapperConfig = require("./scrapper-config");
const Website = require("../models/website");
const Product = require("../models/product");


module.exports = class Scrapperr {

    constructor() {
        this.dbWrapper = new DbWrapper();
        scrapperConfig.forEach(config => {
            this.scrapeIt(config)
        })
    }

    scrapeIt(config) {

        const webScraper = async websiteUrl => {
            try {
                const response = await axios.get(websiteUrl);
                const $ = cheerio.load(response.data);
                const website = new Website(websiteUrl);
                website.insert(websiteUrl);

                const categories = getCategories($, websiteUrl);

                handleContent(categories);

            } catch (err) {
                console.log(err, "ERROR FROM WEB SCRAPPER");
            }
        }

        const getCategories = ($, websiteUrl) => {
            const categories = [];
            $(config.categories.targetClass).each(function (i) {
                if (i > 8) return;
                else {
                    if ($(this)["0"].attribs.href) {
                        const url = `${websiteUrl}${$(this)["0"].attribs.href}&limit=${config.limitPerPage}`;
                        const categoryName = $(this).text().trim();

                        categories.push({
                            url,
                            name: categoryName
                        });
                    }
                }

            });
            insertCategoriesInDb(categories, websiteUrl)
            return categories;
        }

        const insertCategoriesInDb = (categories, websiteUrl) => {
            this.dbWrapper.getFK('website_id', 'websites', websiteUrl)
                .then(response => {
                    const stringRes = JSON.stringify(response);
                    const parsedRes = JSON.parse(stringRes);
                    categories.forEach(category => {
                        this.dbWrapper.updateOrInsert('categories', '(?,?)', [category.name, parsedRes[0].website_id])
                    });
                });
        }

        const handleContent = categories => {
            categories.forEach(category => {
                getWebsiteContent(category.url, category.name);
            });
        }

        const scrapeContent = ($, category_id) => {
            $(config.content.targetClass).each((i, el) => {
                const {
                    content: {
                        queries
                    }
                } = config

                const prductValues = Object.values(generateProductBody($, el, queries, category_id))

                const product = new Product(...prductValues)

                product.insertProductsAndPricesInDb();
            });
        }

        const generateProductBody = ($, el, queries, category_id) => {
            const oldPrice = queries.oldPriceQuery($, el);
            const price = oldPrice ? oldPrice : queries.priceWithoutDiscountQuery($, el);
            return {
                name: queries.nameQuery($, el),
                code: queries.codeQuery($, el),
                category_id,
                price,
                discountedPrice: queries.discountedPriceQuery($, el),
                dateSet: currentDate
            }
        }

        const handleResponse = async ($, category) => {
            const categoryId = this.dbWrapper.getFK('category_id', 'categories', category);
            categoryId
                .then(res => {
                    const string = JSON.stringify(res);
                    const json = JSON.parse(string);
                    scrapeContent($, json[0].category_id)
                }).catch(e => {
                    console.log(e, "get category fk")
                })
        }

        const getWebsiteContent = async (url, category) => {
            try {
                const response = await axios.get(url);
                const $ = cheerio.load(response.data);
                console.log(`Scrapping URL:${url}`)
                await handleResponse($, category);

                if ($(config.pagination.targetClass).length) {
                    const nextPageLink = config.pagination.query($);
                    if (!nextPageLink) {
                        return false;
                    }

                    setTimeout(async () => await getWebsiteContent(nextPageLink, category), 5000)
                    //getWebsiteContent(nextPageLink, category);

                }


            } catch (error) {
                console.log(url, "URL", "ERROR FROM WEBSITE CONTENT")
            }
        }

        webScraper(config.website)

    }
}
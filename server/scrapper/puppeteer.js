const puppeteer = require('puppeteer');
const Utils = require("../helpers/utils");
const DbWrapper = require("../db_wrapper/db_wrapper");
const chalk = require('chalk');

const date = new Date();
const currentDate = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
const scrapperConfig = require("./scrapper-p_config");
const Product = require("../models/product");
const Website = require("../models/website");
const Category = require("../models/category");
const Link = require("../models/link");
const PuppeteerConf = require("./puppeteer-conf");



class Puppeteer extends PuppeteerConf {
    constructor() {
        super();
        this.dbWrapper = new DbWrapper();
        scrapperConfig.forEach(config => {
            this.scrapeIt(config);
        });
    }

    async scrapeIt(conf) {
        try {
            const browser = await puppeteer.launch(this.BROWSER_OPTIONS());

            const page = await browser.newPage();
            await this.requestInterception(page);
            await page.goto(conf.website, {
                // timeout: 25000,
                waitUntil: 'domcontentloaded',
            });

            const website = new Website(conf.website);
            const [, , [{
                "@w_id": website_id
            }]] = await website.insert(conf.website);
            let extractCategories = await this.extractCategories(conf, page);

            if (conf.categories.shouldDistinct)
                extractCategories = Utils.distinct(extractCategories);

            await this.saveCategories(browser, conf, extractCategories, website_id);
            await browser.close();
        } catch (error) {
            console.log(error, "Error in scrappe it")
        }
    }

    async extractCategories(conf, page) {

        return page.evaluate((conf) => Array.from(document.querySelectorAll(conf.categories.selector))
            .map(category => ({
                name: category.textContent.trim(),
                url: `${category.href}&limit=${conf.limitPerPage}&page=1`
            })), conf)
    }

    async saveCategories(browser, conf, extractCategories, website_id) {
        try {
            for (const category of extractCategories) {
                const c = new Category(category.name)
                const [, , [{
                    "@c_id": category_id
                }]] = await c.insert(category.name, website_id);
                console.log(category_id, "CATEGORY ID", category.name)
                await this.extractProductsLink(category.url, browser, conf, category_id);
            }
        } catch (error) {
            console.log(error, "ERROR IN SAVE CATEGORIES")
        }
    }

    async extractProductsLink(url, browser, conf, category_id) {
        try {
            console.log("Scrapping URL:", url)

            const page = await browser.newPage();

            await page.goto(url, {
                // timeout: 25000,
                waitUntil: 'domcontentloaded',
            });

            const productsOnPageLen = await page.evaluate((conf) => document.querySelectorAll(conf.content.selector).length, conf)

            //await page.waitFor(10000);

            // Extract products on the page, recursively check the next page in the URL pattern
            // Terminate if no products exist
            if (!productsOnPageLen) {
                await page.close();
                return;
            }
            await this.extractProduct(browser, page, conf, productsOnPageLen, category_id);
            const image = await this.takeScreenshot(page, url);
            const link = new Link();
            await link.insert(url, image, dateSet, category_id) // to be changed, FK to point to product_id
            await page.close();
            // Go fetch the next page ?page=X+1
            const nextUrl = this.getNextUrl(url);

            await this.extractProductsLink(nextUrl, browser, conf, category_id);
        } catch (error) {
            console.log(error, "ERROR IN EXTRACT PRODUICTS LINK")
        }
    }

    async extractProduct(browser, page, conf, productsOnPageLen, category_id) {
        try {
            let row = 0,
                column = 0,
                url;

            for (let i = 0; i < productsOnPageLen; i++) {
                row = this.getRow(i, conf, row);
                column = this.getColumn(column, conf);

                let urlSelector = conf.productUrlSelector(row, column);

                url = await page.evaluate((sel) => document.querySelector(sel).href, urlSelector);
                await this.saveProduct(browser, url, conf, category_id);
            }
        } catch (error) {
            console.log(error, "ERROR IN EXTRACT PRODUCT")
        }
    }

    async saveProduct(browser, url, {
        content: {
            queries
        }
    }, category_id) {
        try {
            const page = await browser.newPage();
            await this.requestInterception(page);
            await page.goto(url, {
                // timeout: 25000,
                waitUntil: 'domcontentloaded',
            });

            const {
                name,
                code,
                price,
                discountedPrice
            } = await page.evaluate((queries) => {
                let dcPrice = document.querySelector(queries.discountedPriceQuery);
                return {
                    name: document.querySelector(queries.nameQuery).innerText,
                    code: document.querySelector(queries.codeQuery).nextSibling.textContent.trim(),
                    price: document.querySelector(queries.oldPriceQuery).innerText,
                    discountedPrice: dcPrice ? dcPrice.innerText : 'N/A'
                }
            }, queries);

            page.close();
            console.log(name, code, category_id, price, discountedPrice, currentDate)

            new Product(name, code, category_id, price, discountedPrice, currentDate);
        } catch (error) {
            console.log(error, "E")
        }
    }

    async requestInterception(page) {
        try {
            await page.setRequestInterception(true);

            page.on('request', request => {
                const requestUrl = request._url.split('?')[0].split('#')[0];
                if (
                    this.BLOCKED_RESOURCE_TYPES().indexOf(request.resourceType()) !== -1 ||
                    this.SKIPPED_RESOURCES().some(resource => requestUrl.indexOf(resource) !== -1)
                ) {
                    request.abort();
                } else {
                    request.continue();
                }
            });
        } catch (error) {
            console.log(error, "ERROR IN INTERCEPTION")
        }
    }

    getRow(i, {
        columnsPerRow
    }, row) {
        if (i % columnsPerRow === 0)
            return row += 1;

        return row;
    }

    getColumn(column, {
        columnsPerRow
    }) {
        if (column === columnsPerRow) {
            return column = 1;
        }
        return column += 1
    }

    async takeScreenshot(page, url) {
        // keep iamges in local temp folder. to be moved on firebase
        const p = url.split("/");
        page.setViewport({
            width: 1920,
            height: 1080
        });
        const options = {
            path: `images/${p[p.length - 1]}.jpg`,
            type: 'jpeg',
            fullPage: true
        }

        await page.screenshot(options);
        return options.path;
    }

    convertNodeCollectionsToArray(selector) {
        return Array.from(document.querySelectorAll(selector));
    }

    getNextUrl(url) {
        const nextPageNumber = parseInt(url.match(/page=(\d+)$/)[1], 10) + 1;
        const currentUrl = url.split("&");
        currentUrl[currentUrl.length - 1] = `page=${nextPageNumber}`;

        return currentUrl.join("&");
    }
}

new Puppeteer();
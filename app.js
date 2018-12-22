const express = require('express');
const app = express();
const port = 3001;
const webshot = require('webshot');

const rp = require('request-promise');
const cheerio = require('cheerio');
const potusParse = require('./potusParse');
const setec = 'http://www.setec.mk/';


const menuScraper = async options => {
    const pagesToScrape = [];
    try {
        const $ = await rp(options);
        $('.item-vertical > a').each(function (i) {
            const url = `${$(this)["0"].attribs.href}&limit=100`;
            const category = $(this).text().trim();
            pagesToScrape.push({
                url,
                category
            });
        });
        return pagesToScrape;
    } catch (err) {
        console.log(err);
    }
}

const options = {
    uri: setec,
    transform: body => cheerio.load(body)
};

const test = [];

menuScraper(options)
    .then(menus => {
        let data = []
        menus.forEach((menu, i) => {
            options.uri = `${menu.url}`;
            options.category = menu.category;
            test.push({
                [menu.category]: []
            });

            // webshot(options.uri, `set-${i}.png`, function (err) {
            //     if (err) {
            //         console.log(err)
            //     } else
            //         console.log("saved")
            // });
            data.push(contentScrapper(options, i))
        });
        return data;
    });
let page = 1;
const contentScrapper = async (options, index) => {
    const url = options.uri;
    const category = options.category;
    try {
        const $ = await rp(options);
        // console.log(category)
        console.log($('.product-item-container').length)
        if ($('.product-item-container').length < 1) {
            page = 1;
            return;
        } else {
            page++;
            options = {
                ...options,
                uri:`${url}&page=${page}`
            }
            console.log(`Scrapping url:${url},category:${category}`)
            console.log(test)
            contentScrapper(options, index)
        }
        // test[index][category].push($('.product-item-container').length)
        // $('.product-item-container').each(function () {
        //     // console.log(test[i],category)

        //     //test[index][category].push($('.product-item-container').length)
        // });
        //if()
        return test;
    } catch (e) {
        console.log(e)
    }
}


app.get('/', (req, res) => res.send('Hello World!'))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
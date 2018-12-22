const cheerio = require('cheerio');
const chalk = require('chalk');
const axios = require("axios");

const fs = require('fs');
const outputFile = 'data.json';
const url = 'http://www.setec.mk/';
const categories = [];
const parsedResults = [];


const webScraper = async url => {
    try {

        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        $('.item-vertical > a').each(function (i) {
            const url = `${$(this)["0"].attribs.href}&limit=100`;
            const category = $(this).text().trim();
            categories.push({
                url,
                menu: {
                    [category]: 0
                }
            });
        });

        categories.forEach((c, i) => {
            getWebsiteContent(c.url, i, Object.keys(c.menu)[0]);
        });

    } catch (err) {
        console.log(err);
    }
}


const getWebsiteContent = async (url, index, category) => {
    try {
       // console.log(url, "URL")
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);


        // $('.product-item-container').map((i, el) => {
        //     const title = $(el).find('a').attr('href')
        //     const url = $(el).find('h4').text()
        //     const metadata = {
        //         title: title,
        //         url: url
        //     }
        //     parsedResults.push(metadata)
        // })

        console.log(categories[index],category)
        categories[index].menu[category] += $('.product-item-container').length;

        const nextPageLink = $('.pagination').find('.active').next().find('a').attr('href');
        // console.log(chalk.cyan(`  Scraping: ${nextPageLink},category:${category}`));
        console.log(chalk.bold(`Url:${url}`));
        
        console.log(chalk.cyan(`  Scraping: ${nextPageLink},category:${category},length:${$('.product-item-container').length}`));

        // if (pageCounter === pageLimit) {
        //     exportResults(parsedResults)
        //     return false
        // }

        if (!nextPageLink) {
            console.log("stopped")
            console.log(categories)
            // categories[index][category] += $('.product-item-container').length;
            return false;
        }

        getWebsiteContent(nextPageLink, index, category);

    } catch (error) {

        exportResults(parsedResults)
        console.error(error)
    }
}

webScraper(url)

const exportResults = (parsedResults) => {
    fs.writeFile(outputFile, JSON.stringify(parsedResults, null, 4), (err) => {
        if (err) {
            console.log(err)
        }
        console.log(chalk.yellow.bgBlue(`\n ${chalk.underline.bold(parsedResults.length)} Results exported successfully to ${chalk.underline.bold(outputFile)}\n`))
    })
}
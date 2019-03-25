module.exports = SRAPPER_CONFIG = [{
    website: 'http://www.setec.mk/',
    limitPerPage: '100',
    categories: {
        targetClass: '.fade  > .with-sub-menu > a'
    },
    content: {
        targetClass: '.product > .right',
        queries: {
            oldPriceQuery: ($, el) => $(el).find('.price-old').text().trim(),
            priceWithoutDiscountQuery: ($, el) => $(el).find('.price').text().trim(),
            nameQuery: ($, el) => $(el).find('.name').text().trim(),
            codeQuery: ($, el) => $(el).find('.shifra').text().trim().split(':')[1].trim(),
            discountedPriceQuery: ($, el) => $(el).find('.price-new').text().trim()
        }
    },
    pagination: {
        targetClass: '.pagination',
        query: $ => $('.pagination').find('.active').next().find('a').attr('href')
    }
}] 
/// this one works for with cheerio where we use in scrapper .js
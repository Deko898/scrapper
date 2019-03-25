module.exports = SRAPPER_CONFIG = [{
    website: 'http://www.setec.mk/',
    limitPerPage: '100',
    categories: {
        selector: '.fade  > .with-sub-menu > a',
        shouldDistinct: true
    },
    productUrlSelector: (row, column) =>
        `.product-grid > div:nth-child(${row}) > div:nth-child(${column}) .product-hover .name > a`,
    columnsPerRow: 4,
    content: {
        selector: '.product-hover',
        productDetailsSelector: '.name > a',
        queries: {
            oldPriceQuery: '#price-old',
            nameQuery: 'h1',
            codeQuery: '.description :nth-child(9)',
            discountedPriceQuery: '#price-special'
        }
    }
}];
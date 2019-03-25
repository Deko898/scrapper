const DbWrapper = require("../db_wrapper/db_wrapper");

const date = new Date();
const currentDate = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;

const mockData = [{

    name: 'setec',

    categories: [{
        name: 'categoryOne',
        products: [{
                name: 'prod1-categoryOne',
                code: '1',
                price: '1050',
                discountedPrice: '500',
                dateSet: currentDate
            },
            {
                name: 'prod2-categoryOne',
                code: '2',
                price: '1001',
                discountedPrice: '500',
                dateSet: currentDate
            },
            {
                name: 'prod3-NEWPROD-categoryOne',
                code: 'new',
                price: '1451',
                discountedPrice: '5000',
                dateSet: currentDate
            }
        ]
    }, {
        name: 'categoryTwo',
        products: [{
                name: 'prod3-categoryTwo',
                code: '3',
                price: '1053',
                discountedPrice: '500',
                dateSet: currentDate
            },
            {
                name: 'prod2-categoryTwo',
                code: '4',
                price: '1003',
                discountedPrice: '500',
                dateSet: currentDate
            }
        ]
    }]
}];



const dbWrapper = new DbWrapper();

const webScraper = async mockData => {
    try {

        dbWrapper.updateOrInsert('websites', '(?)', [mockData.name]);

        insertCategoriesInDb(mockData.categories, mockData.name);

        handleContent(mockData.categories);

    } catch (err) {
        console.log(err, "ERROR FROM WEB SCRAPPER");
    }
}

const insertCategoriesInDb = (categories, websiteUrl) => {
    dbWrapper.getFK('website_id', 'websites', websiteUrl)
        .then(response => {
            const stringRes = JSON.stringify(response);
            const parsedRes = JSON.parse(stringRes);
            categories.forEach(category => {
                dbWrapper.updateOrInsert('categories', '(?,?)', [category.name, parsedRes[0].website_id])
            });
        });
}

const handleContent = categories => {
    categories.forEach(category => {
        // setTimeout(() => {
        handleResponse(category);
        //}, i * 1000);
    });
}

const scrapeContent = (category, category_id) => {

    category.products.forEach(product => {
        const data = {
            ...product,
            category_id
        }
        insertProductsAndPricesInDb(data)
    })
}

const insertProductsAndPricesInDb = (product) => {
    dbWrapper.insert_products_or_update_prices(product)
        .then(([, {
                affectedRows
            },
            [{
                "@p_id": productId
            }]
        ]) => {
            if (affectedRows && productId) {
                const priceData = [product.price, product.discountedPrice, product.dateSet, productId];
                dbWrapper.updateOrInsert('prices', '(?,?,?,?)', priceData)
                    .then(res => {})
            }
        }).catch(e => e, "ERR")
}

const handleResponse = async (category) => {
    const categoryId = dbWrapper.getFK('category_id', 'categories', category.name);
    categoryId.then(res => {
        const string = JSON.stringify(res);
        const json = JSON.parse(string);
        scrapeContent(category, json[0].category_id)
    })
}



webScraper(mockData[0])
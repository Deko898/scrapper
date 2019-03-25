class PuppeteerConf {

    // {args: ["--proxy-server='direct://'", '--proxy-bypass-list=*']}
    //   options.addArguments("--proxy-server='direct://'");
    // options.addArguments("--proxy-bypass-list=*");
    BROWSER_OPTIONS() {
        return {
            headless: false,
            args: [
                // '--proxy-server=' + proxy,
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920x1080',
            ]
        }
    }

    BLOCKED_RESOURCE_TYPES() {
        return [
            'image',
            'media',
            'font',
            'texttrack',
            'object',
            'beacon',
            'csp_report',
            'imageset',
            'stylesheet',
            'font'
        ];
    }

    SKIPPED_RESOURCES() {
        return [
            'quantserve',
            'adzerk',
            'doubleclick',
            'adition',
            'exelator',
            'sharethrough',
            'cdn.api.twitter',
            'google-analytics',
            'googletagmanager',
            'google',
            'fontawesome',
            'facebook',
            'analytics',
            'optimizely',
            'clicktale',
            'mixpanel',
            'zedo',
            'clicksor',
            'tiqcdn',
        ]
    }
}

module.exports = PuppeteerConf;
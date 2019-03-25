var cron = require('node-cron');

cron.schedule('44 9 * * *', function () {
    console.log('running a task every min');
    test(5)
});


function test(n) {
    if (!n) return;
    console.log(n);

    setTimeout(() => test(n - 1), 3000)
}
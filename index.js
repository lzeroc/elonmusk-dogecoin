const puppeteer = require('puppeteer');
const ccxt = require('ccxt');
const schedule = require('node-schedule');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
let adapter = new FileSync('db.json');
let db = low(adapter);
db.defaults({ orderRecord: [] }).write();

var { search, binance, amount } = require('./config');

const exchange = new ccxt.binance({
  'apiKey': binance.apiKey,
  'secret': binance.secret,
  'timeout': 30000,
  'enableRateLimit': true,
});

function run() {
  //   *    *    *    *    *    *
  // ┬    ┬    ┬    ┬    ┬    ┬
  // │    │    │    │    │    │
  // │    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
  // │    │    │    │    └───── month (1 - 12)
  // │    │    │    └────────── day of month (1 - 31)
  // │    │    └─────────────── hour (0 - 23)
  // │    └──────────────────── minute (0 - 59)
  // └───────────────────────── second (0 - 59, OPTIONAL)
  const rule = '*/1 * * * *';
  schedule.scheduleJob(rule, async () => {
    const browser = await puppeteer.launch({
      headless: true
    });
    const page = await browser.newPage();
    await page.goto('https://twitter.com/elonmusk');

    await page.waitForSelector('article');

    let tweetsArray = await page.$$('div[data-testid="tweet"]');
    for (let tweetElement of tweetsArray) {
      let content = await tweetElement.$$eval('div+div>div>div>span', element => element.map(data => data.innerText));
      for (let keyword of search) {
        if (content.indexOf(keyword) != 1) {
          let tempOrderRecord = db.get('orderRecord')
            .find({
              content: content,
            }).value();
          if (!tempOrderRecord) {
            db.get('orderRecord').push({
              content: content,
            }).write();
            // buy doge
            exchange.createOrder('DOGE/USDT', 'market', 'buy', amount);
          }
        }
      }
    }
    await browser.close();
  });
}

run();

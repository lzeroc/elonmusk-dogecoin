// const twitter = require('./twitter');
const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
  await sreachTweet('chinesevirus', 10);
})();

async function sreachTweet(keyword, count) {
  browser = await puppeteer.launch({
    //如果為true則只在後台運行
    headless: true,
    defaultViewport: {
      width: 1440,
      height: 1080
    }
  });

  let url = `https://twitter.com/search?q=${keyword}%20min_faves%3A200%20lang%3Aen%20until%3A2020-03-24%20since%3A2020-03-17&src=typed_query&f=live`
  let index = 0;
  var page = await browser.newPage();

  await page.goto(url);
  //等待目標元素
  await page.waitFor('div[data-testid="tweet"]');
  let tweets = [];

  while (tweets.length < count) {//當前頁數少於count則繼續
    //滾到頁底,觸發lazyloading
    await page.evaluate('window.scrollTo(0,document.body.scrollHeight)');
    await page.waitFor(3000);
    let tweetsArray = await page.$$('div[data-testid="tweet"]>div.r-1mi0q7o');
    console.log(tweetsArray);

    for (let tweetElement of tweetsArray) {
      index++
      let userName = await tweetElement.$eval('span>span', element => element.innerText);
      let userID = await tweetElement.$eval('div>span', element => element.innerText);
      let Time = await tweetElement.$eval('a[title]', element => element.getAttribute('title'));
      let Content = await tweetElement.$$eval('div+div>div>div>span', element => element.map(data => data.innerText));
      tweets.push({
        index,
        userName,
        userID,
        Time,
        Content
      });
    }
    //以追加模式寫入tweets.json文件
    fs.writeFileSync('./tweets.json', JSON.stringify(tweets), { flag: 'a' }, 'utf-8');
  }
  return tweets;
}

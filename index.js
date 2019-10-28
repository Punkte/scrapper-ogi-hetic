require('dotenv').config()
const puppeteer = require('puppeteer')
const fs = require('fs')

const main = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://outils.hetic.net/auth/login/');

  await page.evaluate(({username, password}) => {
    document.querySelector('#user').value = username
    document.querySelector('#password').value = password
    document.querySelector('form').submit()
  }, { username: process.env.HETIC_USERNAME, password: process.env.HETIC_PWD })

  await page.waitForNavigation()
  await page.click('nav ul li:last-child a')
  
  
  await page.evaluate(() => {
    const selectPromo = document.querySelector('[action="/ogi/search"]:last-child')
    selectPromo.querySelector('select').value = '2020'
    selectPromo.submit()
  })
  await page.waitForNavigation()

  const lines = await page.evaluate(() => {
    return JSON.stringify(
      [...document.querySelectorAll('body > section.ogi > div.bloc_all > table:nth-child(3) > tbody > tr')]
        .map(tr => {
          const name = tr.querySelector('td a').innerHTML
          const company = (tr.querySelector('td:nth-child(2) a').innerHTML).trim()
          const field = tr.querySelector('td:nth-child(3)').innerHTML

          return {
            name,
            company,
            field
          }
        })
      ,
      null,
      2
    )
  })

  fs.writeFile('./data.json', lines, (err, res) => {
    if(err) throw new Error(err)
    console.log(res)
  })
  await page.screenshot({path: 'buddy-screenshot.png'});
  console.log('New Page URL:', page.url())
  await browser.close();
} 

main()
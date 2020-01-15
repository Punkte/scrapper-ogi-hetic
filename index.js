require('dotenv').config()
const puppeteer = require('puppeteer')
const fs = require('fs')

const { kebabCase }  = require('lodash')

const years = [2016, 2017, 2018, 2019, 2020, 2021]

const main = async (year) => {
  const browser = await puppeteer.launch({
    headless: false,
    ignoreHTTPSErrors: true,
    args: [`--window-size=1280,720`]
  });
  const page = await browser.newPage();
  await page.goto('https://outils.hetic.net/auth/login/');

  await page.evaluate(({username, password}) => {
    document.querySelector('#user').value = username
    document.querySelector('#password').value = password
    document.querySelector('form').submit()
  }, { username: process.env.HETIC_USERNAME, password: process.env.HETIC_PWD })

  await page.waitForNavigation()
  
  // Selection de l'onglet ogi
  await page.click('nav ul li:last-child a')
  
  // Selection de l'onglet étudiant
  await page.click('body > section.ogi.home_user > div.breadcrumb > div > a:nth-child(6)')

  await page.select('#select_list_promo_students', year.toString())
  const toKebab = string => kebabCase(string)
  

  await page.screenshot({path: 'buddy-screenshot.png'});
  const lines = await page.evaluate(() => {
    return JSON.stringify(
      [...document.querySelectorAll('body > section.ogi > div.bloc_all > .liste_insertions > tbody > tr')]
        .map(tr => {
          const name = tr.querySelector('td a').innerHTML
          const username = (tr.querySelector('td a').href).split('/').slice(-1)[0]
          const first_name = (tr.querySelector('td:nth-child(2) a').innerHTML).trim()
          const company = tr.querySelector('td:nth-child(3) a').innerText
          const img = `https://outils.hetic.net/external/picture/${username}`

          return {
            username,
            name,
            first_name,
            company,
            img,
          }
        }))
  })

  const linesWithMail = JSON.stringify(JSON.parse(lines).map(el => {
    const { name, first_name } = el
    return {
      ...el,
      mail: `${kebabCase(first_name)}.${kebabCase(name)}@hetic.net`
    }
  }), null,2)

  fs.writeFile(`./data/webp_${year}.json`, linesWithMail, (err, res) => {
    if(err) throw new Error(err)
    console.log(res)
  })
  // await page.screenshot({path: 'buddy-screenshot.png'});
  console.log('New Page URL:', page.url())
  await browser.close();
} 
const run = async () => {
  for(let i = 0; i < years.length; i++) {
    const year = years[i]
    await main(year)
  }
}

run()
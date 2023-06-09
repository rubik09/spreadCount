import TelegramBot from 'node-telegram-bot-api'
import 'dotenv/config'
import axios from 'axios'
import cron from 'node-cron'
import puppeteer from 'puppeteer'
import { BOTID, CHANNELID } from './config.js'

const bot = new TelegramBot(BOTID, { polling: true, filepath: false })
cron.schedule('* * * * *', async () => {
  async function beribitSite () {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-setuid-sandbox",
        "--no-sandbox",
      ]
    });
    const page = await browser.newPage();
    await page.goto('https://beribit.com/exchange/spots/USDT_RUB');
    const client = await page.target().createCDPSession();
    await client.send('Network.enable');
    return new Promise((resolve, reject) => {
      client.on('Network.webSocketFrameReceived', async (event) => {
        const json = JSON.parse(event.response.payloadData);
        if (json.Depth) {
          const beribit = json.Depth.Asks.slice(0, 2).map(item => {
            return { rate: item.ExchangeRate }
          })
          await browser.close();
          resolve(beribit);
        }
      })
    })
  }
  const beribit = await beribitSite();
  const averageBeribit = Number(((beribit[0].rate + beribit[1].rate) / 2).toFixed(3));

  const body = { fiat: 'RUB', page: 1, rows: 10, tradeType: 'buy', asset: 'USDT', countries: [], proMerchantAds: false, publisherType: null, payTypes: ['RaiffeisenBank'] }
  const ddd = await axios.post('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search', body)
  const result = ddd.data.data;
  const newarr = result.slice(1, 3);
  const binance = newarr.map(item => {
    return {
      rate: item.adv.price,
      nick: item.advertiser.nickName
    }
  })

  const averageBinance = Number(((Number(binance[0].rate) + Number(binance[1].rate)) / 2).toFixed(3));
  // console.log(beribit);
  // console.log(binance)
  // console.log(averageBeribit);
  // console.log(averageBinance);

  const diff = Number(((100 - averageBeribit / averageBinance * 100) - 0.1 - 0.08).toFixed(3));
  console.log(diff);
  if (diff >= 0.3) {
    const message = `<b>SOS</b>\u203C\uFE0F\n\n Спред больше 0,3\n\nСпред:${diff}\n\n<b>Beribit</b>: ${beribit[0].rate}, ${beribit[1].rate}\n\nBinance: ${binance[0].rate} - ${binance[0].nick}\n${binance[1].rate} - ${binance[1].nick}`;
    await bot.sendMessage(CHANNELID, message, {
      parse_mode: 'HTML'
    });
  }
});

import TelegramBot from 'node-telegram-bot-api';
import 'dotenv/config';
import axios from 'axios';
import WebSocket from 'ws';
import cron from 'node-cron';
import { BOTID, CHANNELID } from './config';

const bot = new TelegramBot(BOTID, { polling: true, filepath: false });

cron.schedule('* * * * *', async () => {
    const websoket = new WebSocket('wss://beribit.com/ws/depth/usdtrub');
    websoket.once('open', function open() {
      console.log('Connected');
    });
    websoket.once('message', async function incoming(data) {
      const json = JSON.parse(data);
      const beribit = json.Asks.slice(0, 2).map(item => { 
        return { rate: item.ExchangeRate }
    });
      const averageBeribit = Number(((beribit[0].rate + beribit[1].rate) / 2).toFixed(3));
    
      const body = {"fiat":"RUB","page":1,"rows":10,"tradeType":"buy","asset":"USDT","countries":[],"proMerchantAds":false,"publisherType":null,"payTypes":["RaiffeisenBank"]}
    const ddd = await axios.post('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search',body);
    const result = ddd.data.data;
    const newarr = result.slice(1, 3);
    const binance = newarr.map(item => {
      return { rate:item.adv.price,
        nick: item.advertiser.nickName
      };
    });
    
    const averageBinance = Number(((Number(binance[0].rate) + Number(binance[1].rate)) / 2).toFixed(3));
    // console.log(beribit);
    // console.log(binance)
    // console.log(averageBeribit);
    // console.log(averageBinance);
    
    const diff = Number(((100 - averageBeribit/averageBinance * 100) - 0.1 - 0.08).toFixed(3));
    console.log(diff)
    if(diff >= 0.3) {
        const message = `<b>SOS</b>\u203C\uFE0F\n\n Спред больше 0,3\n\nСпред:${diff}\n\n<b>Beribit</b>: ${beribit[0].rate}, ${beribit[1].rate}\n\nBinance: ${binance[0].rate} - ${binance[0].nick}\n${binance[1].rate} - ${binance[1].nick}`;
        await bot.sendMessage(CHANNELID, message, {
            parse_mode: 'HTML'
        });
    }
    try {
        websoket.close();
    } catch (error) {
        console.error('An error occurred while closing WebSocket:', error);
    }
    });
    
    websoket.once('close', function close() {
      console.log('Disconnected');
    });
    websoket.once('error', (err) => {
      console.error('Error occurred:', err);
    });
  });
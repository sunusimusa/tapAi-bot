const PORT = process.env.PORT || 10000;   // KA BAR WANNAN DAYA
import express from 'express';
import TelegramBot from 'node-telegram-bot-api';

const TOKEN = "7740379015:AAHMJdgsvKN-nz1QRHK9Q2eCds-u92BnJbY";
const WEBHOOK_URL = "https://tapai-bot.onrender.com/webhook";
const PORT = process.env.PORT || 3000;   // <--- KA BARI GUDA ƊAYA KAWAI

const app = express();
app.use(express.json());

const bot = new TelegramBot(TOKEN, { webHook: true });
bot.setWebHook(`${WEBHOOK_URL}/${TOKEN}`);

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim() || "";

  if (text === "/start") {
    await bot.sendMessage(chatId, "Welcome! Bot is working fine 😊");
  } else {
    await bot.sendMessage(chatId, "Bot received your message: " + text);
  }
});

app.post(`/webhook/${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log("Bot running on port " + PORT);
});

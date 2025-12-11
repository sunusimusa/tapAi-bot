import express from "express";
import TelegramBot from "node-telegram-bot-api";

const TOKEN = "7740379015:AAHMJdgsvKN-nz1QRHK9Q2eCds-u92BnJbY";
const WEBHOOK_URL = "https://tapai-bot.onrender.com";
const PORT = process.env.PORT || 10000;

const app = express();
app.use(express.json());

// Create bot with webhook mode
const bot = new TelegramBot(TOKEN, { webHook: true });

// Set webhook
bot.setWebHook(`${WEBHOOK_URL}/webhook/${TOKEN}`);

// Bot responses
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim() || "";

  if (text === "/start") {
    await bot.sendMessage(chatId, "🔥 Tele Tech AI is online!\n\nSend any message.");
  } else {
    await bot.sendMessage(chatId, "👍 I received: " + text);
  }
});

// Webhook endpoint
app.post(`/webhook/${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Start express server
app.listen(PORT, () => {
  console.log(`Bot running on port ${PORT}`);
});

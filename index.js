const express = require("express");
const bodyParser = require("body-parser");
const TelegramBot = require("node-telegram-bot-api");

const TOKEN = "<7740379015:AAHMJdgsvKN-nz1QRHK9Q2eCds-u92BnJbY>"; 
const bot = new TelegramBot(TOKEN);

// EXPRESS SERVER
const app = express();
app.use(bodyParser.json());

// ROOT – just to confirm server is running
app.get("/", (req, res) => {
  res.send("Bot is running...");
});

// WEBHOOK ENDPOINT
app.post("/webhook", (req, res) => {
  console.log("Incoming update:", JSON.stringify(req.body, null, 2));

  bot.processUpdate(req.body); 
  res.sendStatus(200);
});

// LISTEN
app.listen(3000, () => {
  console.log("Server listening on PORT 3000");
});

const { Bot } = require("grammy");
const bot = new Bot(process.env.BOT_TOKEN);

// Commands
bot.command("start", ctx => ctx.reply("Welcome to TapAI bot!"));

// All handlers here...


bot.start(); // ← Ka saka nan kawai

// Render Keep Alive Server
const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("TapAI Bot is Running");
});

app.listen(3000, () => {
    console.log("Web server running on port 3000");
});

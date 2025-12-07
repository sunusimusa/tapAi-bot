const { Bot } = require("grammy");
const express = require("express");

// Load BOT TOKEN
const bot = new Bot(process.env.BOT_TOKEN);

// ============ Bot Handlers / Commands ============
// A nan zaka saka duk commands ɗinka da tapping system ɗinka
// misali: bot.command("start", ctx => ctx.reply("Welcome to Tap Miner"));
//
// Duk tsohon code naka wanda ke kula da:
// • tapping
// • energy
// • balance
// • database insert / update
// ZA KA MAIDO SHI A NAN CIKIN WANNAN AREA.
// ================================================

// Mini express server so Render detects a port
const app = express();

// Health check route
app.get("/", (req, res) => {
  res.send("Bot is running");
});

// Port for Render
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server is listening on port ${PORT}`);
});

// Start bot polling
bot.start();

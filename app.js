// ============================
//  TapAI BOT - FIXED VERSION
// ============================

// Import libraries
const { Bot } = require("grammy");
const express = require("express");

// Load Bot
const bot = new Bot(process.env.BOT_TOKEN);

// ===============
//  BOT COMMANDS
// ===============

// /start
bot.command("start", ctx => {
    ctx.reply("👋 Welcome to TapAI Bot!\n\nUse /menu don ganin dukkan commands.");
});

// /menu
bot.command("menu", ctx => {
    ctx.reply(
        "📌 *TapAI Bot Menu*\n\n" +
        "• /start — Start bot\n" +
        "• /menu — Show menu\n" +
        "• /help — Get help\n" +
        "• /energy — Show energy\n" +
        "• /clan — Show clan ID\n",
        { parse_mode: "Markdown" }
    );
});

// /help
bot.command("help", ctx => ctx.reply("❓ Send /menu to view features."));

// /energy example
bot.command("energy", ctx => ctx.reply("⚡ Your energy: 500 / 500"));

// /clan example
bot.command("clan", ctx => ctx.reply("👥 Clan ID: 1234"));


// ======================
//  START TELEGRAM BOT
// ======================
bot.start();
console.log("🤖 TapAI Bot is running...");


// ======================
//  KEEP-ALIVE SERVER
// ======================
const app = express();

app.get("/", (req, res) => {
    res.send("🌐 TapAI Bot server is active!");
});

app.listen(3000, () => {
    console.log("🚀 Web server running on port 3000");
});

const express = require("express");
const { Telegraf } = require("telegraf");
const axios = require("axios");

const app = express();

// === TOKEN DINKA ANAN ===
// KA SA naka TOKEN ANAN
const bot = new Telegraf("8535312579:AAEaMIHnkTN0BxDpVqo1mHatbrXIfxX5uc4");

// ========================
// START COMMAND
// ========================
bot.start((ctx) => {
    ctx.reply("👋 Welcome! Tap AI Bot yana nan. Zaka iya amfani da /menu");
});

// ========================
// MENU
// ========================
bot.command("menu", (ctx) => {
    ctx.reply(
        "👉 *Main Menu*\n\n" +
        "1. Earn coins\n" +
        "2. Invite friends (referral)\n" +
        "3. Check balance\n" +
        "4. Subscribe requirements",
        { parse_mode: "Markdown" }
    );
});

// ========================
// REFERRAL SYSTEM
// ========================
bot.command("invite", (ctx) => {
    const userId = ctx.from.id;
    const link = `https://t.me/${ctx.botInfo.username}?start=${userId}`;

    ctx.reply(
        `🎁 *Referral System*\n\n` +
        `Share this link to invite friends:\n${link}\n\n` +
        `You earn +100 coins per invite!`,
        { parse_mode: "Markdown" }
    );
});

// ========================
// EARN COINS
// ========================
bot.command("earn", (ctx) => {
    ctx.reply("💰 Earn Section coming soon!");
});

// ========================
// CHECK BALANCE
// ========================
bot.command("balance", (ctx) => {
    ctx.reply("💳 Your balance feature is coming soon!");
});

// ========================
// SUBSCRIPTION REQUIREMENT
// ========================
bot.command("subscribe", (ctx) => {
    ctx.reply(
        "📌 *Required Subscriptions:*\n\n" +
        "🔗 YouTube: https://www.youtube.com/@Sunusicrypto\n" +
        "🔗 Telegram Channel 1: https://t.me/tele_tap_ai\n" +
        "🔗 Telegram Channel 2: https://t.me/TeleAIupdates",
        { parse_mode: "Markdown" }
    );
});

// ========================
// EXPRESS (RENDER KEEP ALIVE)
// ========================
app.get("/", (req, res) => {
    res.send("Bot is running!");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on port", PORT));

// Start bot
bot.launch();

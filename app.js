// ===============================
// 📌 TAPAI BOT - READY TO USE
// ===============================

const { Bot } = require("grammy");
const express = require("express");

// Load BOT TOKEN
const bot = new Bot(process.env.BOT_TOKEN);

// ===============================
// 🔥 START COMMAND
// ===============================
bot.command("start", async ctx => {
    await ctx.reply(
        "👋 *Welcome to TapAI Bot!*\n\n" +
        "Tap /menu don ganin cikakken menu.",
        { parse_mode: "Markdown" }
    );
});

// ===============================
// 📌 MENU COMMAND
// ===============================
bot.command("menu", async ctx => {
    await ctx.reply(
        "📌 *TapAI Menu*\n\nZaɓi abin da kake so👇",
        {
            parse_mode: "Markdown",
            reply_markup: {
                keyboard: [
                    [{ text: "💠 My Profile" }],
                    [{ text: "⚡ Energy" }, { text: "🪙 Balance" }],
                    [{ text: "👥 Clan" }, { text: "🎁 Daily Reward" }],
                    [{ text: "👤 Invite Friends" }]
                ],
                resize_keyboard: true
            }
        }
    );
});

// ===============================
// 📌 BUTTON HANDLERS
// ===============================

// My Profile
bot.hears("💠 My Profile", ctx => {
    ctx.reply(
        "👤 *Profile*\n" +
        `Name: ${ctx.from.first_name}\n` +
        "Level: 1\nXP: 0/100",
        { parse_mode: "Markdown" }
    );
});

// Energy
bot.hears("⚡ Energy", ctx => {
    ctx.reply("⚡ Your Energy: 100/100");
});

// Balance
bot.hears("🪙 Balance", ctx => {
    ctx.reply("💰 Your Balance: 0 TLC");
});

// Clan
bot.hears("👥 Clan", ctx => {
    ctx.reply("👥 You are not in any clan yet.");
});

// Daily Reward
bot.hears("🎁 Daily Reward", ctx => {
    ctx.reply("🎉 You claimed your daily reward: +10 TLC");
});

// Invite Friends
bot.hears("👤 Invite Friends", ctx => {
    const link = `https://t.me/${ctx.botInfo.username}?start=${ctx.from.id}`;
    ctx.reply(
        "👤 *Invite your friends with this link:*\n" + link,
        { parse_mode: "Markdown" }
    );
});

// ===============================
// 🚀 START BOT
// ===============================
bot.start();
console.log("🤖 TapAI Bot is running...");

// ===============================
// 🌐 KEEP-ALIVE SERVER (Render)
// ===============================
const app = express();

app.get("/", (req, res) => {
    res.send("TapAI Bot is Running");
});

app.listen(3000, () => {
    console.log("🌍 Web server running on port 3000");
});

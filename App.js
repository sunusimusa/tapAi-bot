const { Bot } = require("grammy");
const express = require("express");

// Load BOT TOKEN
const bot = new Bot(process.env.BOT_TOKEN);

// ============ Bot Handlers / Commands ============
//start/menu/tap/balance : bot.command("start", ctx => ctx.reply("Welcome to Tap Miner"));
//
//// ===============================
// TAPAI BOT - MAIN BOT FILE
// ===============================

const { Bot } = require("grammy");

// Load bot token from Render environment variable
const bot = new Bot(process.env.BOT_TOKEN);

// START command
bot.command("start", async ctx => {
    await ctx.reply(
        "👋 Welcome to TapAI Bot!\n\nUse /menu to open the game menu.",
        { parse_mode: "Markdown" }
    );
});

// MENU command
bot.command("menu", async ctx => {
    await ctx.reply(
        "📌 TapAI Menu\n\nChoose an option below:",
        {
            parse_mode: "Markdown",
            reply_markup: {
                keyboard: [
                    [{ text: "💠 My Profile" }],
                    [{ text: "⚡ Energy" }, { text: "🪙 Balance" }],
                    [{ text: "👥 Clan" }, { text: "🎁 Daily Reward" }],
                    [{ text: "👤 Invite Friends" }],
                    [{ text: "👆 TAP to Earn" }]
                ],
                resize_keyboard: true
            }
        }
    );
});

// Basic TAP system
let users = {};

bot.hears("👆 TAP to Earn", async ctx => {
    const id = ctx.from.id;

    if (!users[id]) {
        users[id] = { coins: 0, energy: 100 };
    }

    if (users[id].energy <= 0) {
        return ctx.reply("⚠️ No energy! Wait for refill.");
    }

    users[id].coins += 1;
    users[id].energy -= 1;

    await ctx.reply(
        `💥 Tap registered!\n🪙 Coins: ${users[id].coins}\n⚡ Energy: ${users[id].energy}`
    );
});

// • tapping
// • energy
// • balance
// • database insert / update
// bot.command("mine", async (ctx) => {
    const id = ctx.from.id;
    const user = await getUser(id);

    if (user.energy <= 0) {
        return ctx.reply("⚡ *No energy left!* Jira ta dawo.\n\n/energy don gani", { parse_mode: "Markdown" });
    }

    // Add 1 coin per tap
    await db.query(
        "UPDATE users SET balance = balance + 1, energy = energy - 1 WHERE user_id=$1",
        [id]
    );

    ctx.reply(`🪙 +1 coin!\n💰 Balance: ${user.balance + 1}\n⚡ Energy: ${user.energy - 1}`);
});


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

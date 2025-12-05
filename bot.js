// ===============================
// TAPAI BOT - MAIN BOT FILE
// ===============================

const { Bot } = require("grammy");

// Load bot token
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

// Start bot
bot.start();

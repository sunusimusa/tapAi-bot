// ===============================
// 📌 TAPAI BOT - READY TO USE (WITH TAP SYSTEM)
// ===============================

const { Bot } = require("grammy");
const express = require("express");

// 🔐 Load BOT TOKEN\const bot = new Bot(process.env.BOT_TOKEN);

// ===============================
// 📌 USER DATA (RAM Storage)
// ===============================
let users = {};

function getUser(id) {
    if (!users[id]) {
        users[id] = {
            coins: 0,
            energy: 100,
            maxEnergy: 100,
            xp: 0,
            level: 1
        };
    }
    return users[id];
}

// ===============================
// 🔥 LEVEL SYSTEM
// ===============================
function updateLevel(user) {
    let requiredXP = user.level * 100;
    if (user.xp >= requiredXP) {
        user.level++;
        user.xp = 0;
        return true;
    }
    return false;
}

// ===============================
// 🔥 START COMMAND
// ===============================

bot.command("start", async ctx => {
    const id = ctx.from.id;
    getUser(id);

    await ctx.reply(
        "👋 *Welcome to TapAI Bot!*\n\nTap /menu to continue.",
        { parse_mode: "Markdown" }
    );
});

// ===============================
// 📌 MENU COMMAND
// ===============================

bot.command("menu", async ctx => {
    await ctx.reply(
        "📌 *TapAI Menu*\n\nChoose an option 👇",
        {
            parse_mode: "Markdown",
            reply_markup: {
                keyboard: [
                    [{ text: "💠 My Profile" }],
                    [{ text: "⚡ Energy" }, { text: "🪙 Balance" }],
                    [{ text: "👆 Tap to Earn" }],
                    [{ text: "🎁 Daily Reward" }]
                ],
                resize_keyboard: true
            }
        }
    );
});

// ===============================
// 🔹 My Profile
// ===============================
bot.hears("💠 My Profile", async ctx => {
    const user = getUser(ctx.from.id);

    await ctx.reply(
        `👤 *Your Profile*\n\n` +
        `🪙 Coins: *${user.coins}*\n` +
        `⚡ Energy: *${user.energy}/${user.maxEnergy}*\n` +
        `⭐ XP: *${user.xp}*\n` +
        `🎚 Level: *${user.level}*`,
        { parse_mode: "Markdown" }
    );
});

// ===============================
// 🔹 ENERGY CHECK
// ===============================
bot.hears("⚡ Energy", async ctx => {
    const user = getUser(ctx.from.id);

    await ctx.reply(`⚡ Your energy: *${user.energy}/${user.maxEnergy}*`, {
        parse_mode: "Markdown"
    });
});

// ===============================
// 🔹 BALANCE CHECK
// ===============================
bot.hears("🪙 Balance", async ctx => {
    const user = getUser(ctx.from.id);
    await ctx.reply(`🪙 Your coins: *${user.coins}*`, { parse_mode: "Markdown" });
});

// ===============================
// 🔥 TAP TO EARN SYSTEM
// ===============================
bot.hears("👆 Tap to Earn", async ctx => {
    const user = getUser(ctx.from.id);

    if (user.energy <= 0) {
        return ctx.reply("❌ Your energy is empty. Come back later to recharge.");
    }

    // 🔹 Deduct energy and give coins
    user.energy -= 10;
    user.coins += 5;
    user.xp += 10;

    let levelUp = updateLevel(user);

    let msg = `👆 *You tapped!*\n+5 coins\n-10 energy`;

    if (levelUp) msg += `\n\n🔥 *LEVEL UP!* You are now level ${user.level}`;

    await ctx.reply(msg, { parse_mode: "Markdown" });
});

// ===============================
// 🎁 DAILY REWARD
// ===============================
let daily = {};

bot.hears("🎁 Daily Reward", async ctx => {
    const id = ctx.from.id;
    const now = Date.now();

    if (daily[id] && now - daily[id] < 24 * 60 * 60 * 1000) {
        return ctx.reply("⏳ You already claimed your daily reward. Try again later.");
    }

    daily[id] = now;

    const user = getUser(id);
    user.coins += 50;
    user.energy = user.maxEnergy;

    await ctx.reply(
        "🎁 *Daily Reward!*\n+50 coins\n⚡ Energy restored",
        { parse_mode: "Markdown" }
    );
});

// ===============================
// 🌐 EXPRESS KEEP-ALIVE SERVER
// ===============================
const app = express();
app.get('/', (req, res) => res.send("TapAI Bot Running"));
app.listen(3000, () => console.log("Server running on port 3000"));

// ===============================
// 🚀 START BOT
// ===============================
bot.start();

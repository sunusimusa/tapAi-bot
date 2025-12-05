// ===============================
// 📌 TAPAI BOT - READY TO USE
// ===============================

const { Bot } = require("grammy");
const express = require("express");

// Load BOT TOKEN
const bot =

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
const express = require("express");
const { Telegraf } = require("telegraf");
const fs = require("fs");

const app = express();
app.use(express.json());

// ====== BOT TOKEN ======
const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);

// ====== FAKE DATABASE (JSON FILE) ======
const DB_FILE = "db.json";

function loadDB() {
  if (!fs.existsSync(DB_FILE)) return {};
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

let db = loadDB();

function getUser(id) {
  if (!db[id]) {
    db[id] = { taps: 0, wallet: null, username: null };
    saveDB(db);
  }
  return db[id];
}

// ====== COMMANDS ======

bot.start((ctx) => {
  const user = ctx.from;
  getUser(user.id);

  ctx.reply(
    `👋 *Welcome ${user.first_name}!*  
Welcome to *TeleAI Tap Bot* 🚀

Use these commands:
👉 /tap – tap +1  
👉 /leaderboard – top users  
👉 /wallet – set TON wallet  
👉 /profile – view your profile  

Enjoy tapping! 😁`,
    { parse_mode: "Markdown" }
  );
});

// TAP COMMAND
bot.command("tap", (ctx) => {
  const user = getUser(ctx.from.id);
  user.taps += 1;
  saveDB(db);

  ctx.reply(`🖐️ *Tap counted!*  
Taps: *${user.taps}*`, { parse_mode: "Markdown" });
});

// LEADERBOARD
bot.command("leaderboard", (ctx) => {
  const sorted = Object.entries(db)
    .map(([id, d]) => ({ id, taps: d.taps }))
    .sort((a, b) => b.taps - a.taps)
    .slice(0, 10);

  let msg = "🏆 *Top 10 Tappers*\n\n";

  sorted.forEach((u, i) => {
    msg += `${i + 1}. User ${u.id}: *${u.taps} taps*\n`;
  });

  ctx.reply(msg, { parse_mode: "Markdown" });
});

// WALLET
bot.command("wallet", (ctx) => {
  const parts = ctx.message.text.split(" ");

  if (parts.length === 1) {
    return ctx.reply("💳 *Usage:* /wallet YOUR_TON_WALLET");
  }

  const wallet = parts[1];
  const user = getUser(ctx.from.id);
  user.wallet = wallet;
  saveDB(db);

  ctx.reply(`✅ Wallet saved!\n📌 ${wallet}`);
});

// PROFILE
bot.command("profile", (ctx) => {
  const user = getUser(ctx.from.id);

  ctx.reply(
    `👤 *Your Profile*\n\n` +
      `🆔 ID: ${ctx.from.id}\n` +
      `🖐️ Taps: *${user.taps}*\n` +
      `💳 Wallet: ${user.wallet ? user.wallet : "Not set"}\n`,
    { parse_mode: "Markdown" }
  );
});

// ====== EXPRESS TEST ROUTE ======
app.get("/", (req, res) => {
  res.send("TeleAI Bot is running 🚀");
});

// ====== START APP ======
bot.launch();
app.listen(3000, () => {
  console.log("Bot + Server running on port 3000");
});

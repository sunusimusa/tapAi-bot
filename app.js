// ===============================
// 📌 TAPAI BOT - READY TO USE
// ===============================

// ✅ Correct express import
const { Bot } = require("grammy");
const express = require("express");

// ✅ Load BOT TOKEN daga environment variable
const bot = new Bot(process.env.BOT_TOKEN);

// ===============================
// 🔥 START COMMAND
// ===============================
bot.command("start", async ctx => {
    await ctx.reply(
        "👋 *Barka da zuwa TapAI Bot!*\n\n" +
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
// ---- TAP SYSTEM (JSON storage) ----
const fs = require("fs");
const path = require("path");
const USERS_FILE = path.join(__dirname, "users.json");

const ENERGY_MAX = Number(process.env.ENERGY_MAX || 100);
const START_ENERGY = Number(process.env.START_ENERGY || 20);
const ENERGY_RESTORE_RATE_SECONDS = Number(process.env.ENERGY_RESTORE_RATE_SECONDS || 60);
const SAVE_DEBOUNCE_MS = Number(process.env.SAVE_DEBOUNCE_MS || 1000);

let users = {};
let saveTimer = null;

function loadUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify({}, null, 2), "utf8");
    }
    const raw = fs.readFileSync(USERS_FILE, "utf8");
    users = raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error("Failed to load users.json:", err);
    users = {};
  }
}

function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    try {
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
    } catch (err) {
      console.error("Failed to save users.json:", err);
    } finally {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
  }, SAVE_DEBOUNCE_MS);
}

function getUser(id, name = "") {
  if (!users[id]) {
    users[id] = {
      id,
      name,
      coins: 0,
      xp: 0,
      energy: START_ENERGY,
      lastTap: 0
    };
    scheduleSave();
  }
  return users[id];
}

// Load at startup
loadUsers();

// TAP command
// Assumes `bot` variable exists (Telegraf or grammY). If your bot variable name is different, adapt.
bot.command("tap", async (ctx) => {
  try {
    const tgId = ctx.from && (ctx.from.id || ctx.from.user_id) ? (ctx.from.id || ctx.from.user_id) : String(ctx.chat && ctx.chat.id);
    const username = ctx.from && (ctx.from.username || `${ctx.from.first_name || ""} ${ctx.from.last_name || ""}`) || "user";
    if (!tgId) return ctx.reply("Ba zan iya gane ID dinka ba.");

    const user = getUser(String(tgId), username);

    if (user.energy <= 0) {
      return ctx.reply("⚠️ Babu energy — kana bukatar ka jira energy ya dawo kafin ka iya tapping.");
    }

    // Basic anti-spam: limit taps to 1 per second (adjustable)
    const now = Date.now();
    if (now - (user.lastTap || 0) < 800) {
      return ctx.reply("🕐 Ka rage gudu — jira ɗan kankanin lokaci ka sake tapping.");
    }

    user.coins = (user.coins || 0) + 1;      // +1 coin per tap
    user.xp = (user.xp || 0) + 1;            // +1 xp per tap (adjustable)
    user.energy = Math.max(0, (user.energy || START_ENERGY) - 1); // reduce energy
    user.lastTap = now;
    user.name = username;

    scheduleSave();

    return ctx.reply(`✅ Tap! +1 coin\nCoins: ${user.coins}\nXP: ${user.xp}\nEnergy: ${user.energy}/${ENERGY_MAX}`);
  } catch (err) {
    console.error("tap command error:", err);
    return ctx.reply("An samu matsala yayin processing tap ɗinka. Gwada sake shi.");
  }
});

// PROFILE command - shows user stats
bot.command("profile", async (ctx) => {
  try {
    const tgId = ctx.from && (ctx.from.id || ctx.from.user_id) ? (ctx.from.id || ctx.from.user_id) : String(ctx.chat && ctx.chat.id);
    if (!tgId) return ctx.reply("Ba zan iya gane ID dinka ba.");

    const user = getUser(String(tgId));
    return ctx.reply(`🧾 Profile:
Coins: ${user.coins}
XP: ${user.xp}
Energy: ${user.energy}/${ENERGY_MAX}`);
  } catch (err) {
    console.error("profile command error:", err);
    return ctx.reply("An samu matsala wajen nuna profile ɗinka.");
  }
});

// Energy restore loop
setInterval(() => {
  let changed = false;
  const now = Date.now();
  for (const id in users) {
    const u = users[id];
    if (u.energy < ENERGY_MAX) {
      u.energy = Math.min(ENERGY_MAX, u.energy + 1);
      changed = true;
    }
  }
  if (changed) scheduleSave();
}, ENERGY_RESTORE_RATE_SECONDS * 1000);

// ---- end TAP SYSTEM ----

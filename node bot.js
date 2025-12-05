// ===============================
// TapAI Bot - Tap-to-Earn (Notcoin-like)
// ===============================
const { Bot } = require("grammy");
const express = require("express");
const fs = require("fs");
const path = require("path");

// ---------- ENV / CONFIG ----------
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error("Missing BOT_TOKEN in environment!");
  process.exit(1);
}
const bot = new Bot(BOT_TOKEN);

const USERS_FILE = path.join(__dirname, "users.json");
const ENERGY_MAX = Number(process.env.ENERGY_MAX || 100);
const START_ENERGY = Number(process.env.START_ENERGY || 30);
const ENERGY_RESTORE_RATE_SECONDS = Number(process.env.ENERGY_RESTORE_RATE_SECONDS || 60); // +1 energy per X seconds
const SAVE_DEBOUNCE_MS = Number(process.env.SAVE_DEBOUNCE_MS || 1000);
const TAP_COOLDOWN_MS = Number(process.env.TAP_COOLDOWN_MS || 5000); // 5s default
const GAME_URL = process.env.GAME_URL || ""; // referral link (optional)

// ---------- STORAGE ----------
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
      level: 1,
      energy: START_ENERGY,
      lastTapAt: 0,
      tapStreak: 0,        // consecutive taps without missing (for bonus)
      lastDailyClaim: 0
    };
    scheduleSave();
  }
  return users[id];
}

// load on startup
loadUsers();

// ---------- UTIL ----------
function randomInt(min, max) { // inclusive
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function checkLevelUp(user) {
  const xpNeeded = user.level * 100;
  if (user.xp >= xpNeeded) {
    user.level += 1;
    user.xp = user.xp - xpNeeded;
    return true;
  }
  return false;
}

// ---------- BOT COMMANDS & HANDLERS ----------

// start
bot.command("start", async ctx => {
  const id = String(ctx.from.id);
  const name = ctx.from.username || `${ctx.from.first_name || ""}`.trim();
  getUser(id, name);
  await ctx.reply(
    "👋 Welcome to TapAI! Type /menu or press the keyboard to begin."
  );
});

// menu (keyboard)
bot.command("menu", async ctx => {
  await ctx.reply("📌 TapAI Menu\nChoose an option 👇", {
    reply_markup: {
      keyboard: [
        [{ text: "💠 My Profile" }],
        [{ text: "👆 Tap to Earn" }, { text: "🪙 Balance" }],
        [{ text: "🏆 Leaderboard" }, { text: "🎁 Daily" }],
        [{ text: "🔗 Invite Friends" }]
      ],
      resize_keyboard: true
    }
  });
});

// profile
bot.hears("💠 My Profile", async ctx => {
  const id = String(ctx.from.id);
  const user = getUser(id, ctx.from.username || ctx.from.first_name || "user");
  await ctx.reply(
    `👤 Profile\n\n🪙 Coins: ${user.coins}\n⭐ XP: ${user.xp}\n🎚 Level: ${user.level}\n⚡ Energy: ${user.energy}/${ENERGY_MAX}\n🔥 Streak: ${user.tapStreak}`
  );
});

// balance quick
bot.hears("🪙 Balance", async ctx => {
  const id = String(ctx.from.id);
  const user = getUser(id);
  await ctx.reply(`🪙 Your coins: ${user.coins}`);
});

// invite friends (show GAME_URL if set)
bot.hears("🔗 Invite Friends", async ctx => {
  if (GAME_URL) {
    await ctx.reply(`🔗 Invite your friends with this link:\n${GAME_URL}`);
  } else {
    await ctx.reply("🔗 Referral link not configured.");
  }
});

// leaderboard
bot.hears("🏆 Leaderboard", async ctx => {
  // compute top 10 by coins
  const arr = Object.values(users);
  arr.sort((a, b) => (b.coins || 0) - (a.coins || 0));
  const top = arr.slice(0, 10);
  if (top.length === 0) return ctx.reply("No players yet.");
  let msg = "🏆 Leaderboard (Top 10)\n\n";
  top.forEach((u, i) => {
    msg += `${i+1}. ${u.name || "user"} — ${u.coins} coins (Lv ${u.level})\n`;
  });
  await ctx.reply(msg);
});

// daily reward
bot.hears("🎁 Daily", async ctx => {
  const id = String(ctx.from.id);
  const user = getUser(id);
  const now = Date.now();
  const DAY = 24*60*60*1000;
  if (user.lastDailyClaim && now - user.lastDailyClaim < DAY) {
    const next = new Date(user.lastDailyClaim + DAY);
    return ctx.reply(`⏳ You already claimed daily. Next available: ${next.toUTCString()}`);
  }
  user.lastDailyClaim = now;
  const reward = randomInt(20, 60);
  user.coins += reward;
  user.energy = Math.min(ENERGY_MAX, user.energy + 30);
  scheduleSave();
  await ctx.reply(`🎁 Daily claimed! +${reward} coins and +30 energy (capped).`);
});

// TAP mechanic - command and keyboard
async function handleTap(ctx) {
  const id = String(ctx.from.id);
  const user = getUser(id, ctx.from.username || ctx.from.first_name || "user");
  const now = Date.now();

  // cooldown check
  if (now - (user.lastTapAt || 0) < TAP_COOLDOWN_MS) {
    const wait = Math.ceil((TAP_COOLDOWN_MS - (now - user.lastTapAt)) / 1000);
    return ctx.reply(`🕐 Slow down! Wait ${wait}s before next tap.`);
  }

  // energy check
  const ENERGY_COST = 1; // cost per tap (adjustable)
  if ((user.energy || 0) < ENERGY_COST) {
    return ctx.reply("⚠️ You don't have enough energy. Wait for recharge or claim daily.");
  }

  // compute reward similar to Notcoin style: mostly small, chance for big reward
  // base coin: 1-3
  let base = randomInt(1, 3);

  // streak bonus: each consecutive tap (without missing more than 10 minutes) increases multiplier
  const STREAK_TIMEOUT = 10 * 60 * 1000; // 10 minutes
  if (user.lastTapAt && (now - user.lastTapAt) <= STREAK_TIMEOUT) {
    user.tapStreak = (user.tapStreak || 0) + 1;
  } else {
    user.tapStreak = 1;
  }

  // streak multiplier: small growth capped
  const streakMultiplier = 1 + Math.min(user.tapStreak, 10) * 0.05; // up to +50%
  base = Math.floor(base * streakMultiplier);

  // rare jackpot: 1% chance to get 100-500 coins
  const r = Math.random();
  let jackpot = 0;
  if (r < 0.01) {
    jackpot = randomInt(100, 500);
  } else if (r < 0.05) {
    // uncommon big reward 4% -> 10-50
    jackpot = randomInt(10, 50);
  }

  const reward = base + jackpot;

  // update user
  user.coins = (user.coins || 0) + reward;
  user.xp = (user.xp || 0) + Math.max(1, Math.floor(reward / 2));
  user.energy = Math.max(0, (user.energy || START_ENERGY) - ENERGY_COST);
  user.lastTapAt = now;

  const leveled = checkLevelUp(user);
  scheduleSave();

  let msg = `👆 Tap successful! +${reward} coins\nCoins: ${user.coins}\nXP: ${user.xp}\nEnergy: ${user.energy}/${ENERGY_MAX}\nStreak: ${user.tapStreak}`;
  if (jackpot > 0) msg = `🎉 JACKPOT! +${reward} coins!\n` + msg;
  if (leveled) msg += `\n\n🔥 LEVEL UP! You are now level ${user.level}`;

  await ctx.reply(msg);
}

bot.command("tap", handleTap);
bot.hears("👆 Tap to Earn", handleTap);

// ---------- ENERGY RESTORE LOOP ----------
setInterval(() => {
  let changed = false;
  for (const id in users) {
    const u = users[id];
    if (u.energy < ENERGY_MAX) {
      u.energy = Math.min(ENERGY_MAX, u.energy + 1);
      changed = true;
    }
  }
  if (changed) scheduleSave();
}, ENERGY_RESTORE_RATE_SECONDS * 1000);

// ---------- KEEP-ALIVE SERVER FOR HOSTING ----------
const app = express();
app.get("/", (req, res) => res.send("TapAI Bot running"));
const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));

// ---------- START BOT ----------
bot.start();
